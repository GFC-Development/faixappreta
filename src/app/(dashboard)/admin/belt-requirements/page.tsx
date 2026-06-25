"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BeltIcon } from "@/components/belt-icon";
import { BELTS, KIDS_BELTS, KIDS_BELT_LABELS } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";

const DEGREES = [1, 2, 3, 4];

interface Requirement {
  belt: string;
  requiredClasses: number;
}

interface DegreeRequirement {
  belt: string;
  degree: number;
  requiredClasses: number;
}

function getPromotionBelts(belts: string[]): string[] {
  return belts.slice(1);
}

function getBeltTransitionLabel(belts: string[], belt: string, isKids: boolean): string {
  const idx = belts.indexOf(belt);
  if (idx <= 0) return belt;
  const prev = belts[idx - 1];
  const prevLabel = isKids ? (KIDS_BELT_LABELS[prev] || prev) : prev;
  const curLabel = isKids ? (KIDS_BELT_LABELS[belt] || belt) : belt;
  return `${prevLabel} → ${curLabel}`;
}

export default function BeltRequirementsPage() {
  const [mode, setMode] = useState<"adult" | "kids">("adult");
  const [requirements, setRequirements] = useState<Record<string, number>>({});
  const [degreeReqs, setDegreeReqs] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/belt-requirements")
      .then((r) => r.json())
      .then((data: Requirement[]) => {
        const map: Record<string, number> = {};
        data.forEach((r) => { map[r.belt] = r.requiredClasses; });
        setRequirements(map);
      });

    fetch("/api/belt-requirements?type=degree")
      .then((r) => r.json())
      .then((data: DegreeRequirement[]) => {
        const map: Record<string, number> = {};
        data.forEach((r) => { map[`${r.belt}-${r.degree}`] = r.requiredClasses; });
        setDegreeReqs(map);
      });
  }, []);

  const activeBelts = mode === "kids" ? KIDS_BELTS : BELTS;
  const promotionBelts = getPromotionBelts(activeBelts);
  const isKids = mode === "kids";

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    const beltBody = promotionBelts.map((belt) => ({
      belt,
      requiredClasses: requirements[belt] || 0,
    }));

    const degreeBody: { belt: string; degree: number; requiredClasses: number }[] = [];
    activeBelts.forEach((belt) => {
      DEGREES.forEach((degree) => {
        const key = `${belt}-${degree}`;
        if (degreeReqs[key] !== undefined && degreeReqs[key] > 0) {
          degreeBody.push({ belt, degree, requiredClasses: degreeReqs[key] });
        }
      });
    });

    await Promise.all([
      fetch("/api/belt-requirements", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(beltBody),
      }),
      degreeBody.length > 0
        ? fetch("/api/belt-requirements?type=degree", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(degreeBody),
          })
        : Promise.resolve(),
    ]);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-[700px] mx-auto">
      <PageHeader title="Requisitos de Graduação" subtitle="Configure a quantidade de aulas necessárias para avançar de faixa e de grau." />

      <div className="flex gap-2 mb-5">
        <Button
          variant={mode === "adult" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setMode("adult")}
        >
          Adulto
        </Button>
        <Button
          variant={mode === "kids" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setMode("kids")}
        >
          Kids
        </Button>
      </div>

      <form onSubmit={handleSave}>
        <Card className="mb-4">
          <h2 className="font-semibold text-[14px] text-[#17181c] mb-4">Requisitos por Faixa</h2>
          <div className="space-y-5">
            {promotionBelts.map((belt) => (
              <div key={belt} className="flex items-center gap-4">
                <BeltIcon belt={belt} size={24} />
                <div className="flex-1">
                  <Input
                    label={getBeltTransitionLabel(activeBelts, belt, isKids)}
                    type="number"
                    min="0"
                    value={String(requirements[belt] || "")}
                    onChange={(e) =>
                      setRequirements({
                        ...requirements,
                        [belt]: Number(e.target.value) || 0,
                      })
                    }
                    placeholder="Ex: 50"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="mb-4">
          <h2 className="font-semibold text-[14px] text-[#17181c] mb-2">Requisitos por Grau</h2>
          <p className="text-[11.5px] text-[#9b9ca2] mb-4">
            Aulas necessárias para cada grau dentro de cada faixa.
          </p>
          <div className="space-y-6">
            {activeBelts.map((belt) => (
              <div key={belt}>
                <div className="flex items-center gap-2 mb-3">
                  <BeltIcon belt={belt} size={20} />
                  <span className="text-[13px] font-medium text-[#5c5d63]">
                    {isKids ? (KIDS_BELT_LABELS[belt] || belt) : belt}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {DEGREES.map((degree) => {
                    const key = `${belt}-${degree}`;
                    return (
                      <Input
                        key={key}
                        label={`${degree}° grau`}
                        type="number"
                        min="0"
                        value={String(degreeReqs[key] || "")}
                        onChange={(e) =>
                          setDegreeReqs({
                            ...degreeReqs,
                            [key]: Number(e.target.value) || 0,
                          })
                        }
                        placeholder="0"
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
          {saved && (
            <span className="text-[13px] text-[#0f7a4d] font-semibold">Salvo com sucesso!</span>
          )}
        </div>
      </form>
    </div>
  );
}
