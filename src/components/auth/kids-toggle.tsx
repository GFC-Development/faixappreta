"use client";

interface KidsToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function KidsToggle({ checked, onChange }: KidsToggleProps) {
  return (
    <div className="flex items-center gap-[13px] p-[13px_15px] border border-[#e3e3e0] rounded-[13px] bg-white">
      <div className="flex-1">
        <div className="font-semibold text-sm">Cadastro Kids</div>
        <div className="text-[11.5px] text-[#9b9ca2] mt-0.5">
          Aluno menor de idade (responsável)
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative flex-none w-[46px] h-[26px] rounded-[20px] transition-colors"
        style={{ background: checked ? "#e08a1e" : "#d8d8db" }}
      >
        <span
          className="absolute top-[3px] w-5 h-5 rounded-full bg-white transition-[left]"
          style={{ left: checked ? 23 : 3 }}
        />
      </button>
    </div>
  );
}
