import CalculatorEngine from "@/components/CalculatorEngine";

export default function CalculatorPage() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight text-surface-800">Υπολογισμός Παραγγελιών</h1>
      </div>
      
      <CalculatorEngine />
    </div>
  );
}
