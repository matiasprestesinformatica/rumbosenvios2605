import SuggestionForm from './suggestion-form';

export default function DeliverySuggestionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Herramienta de Sugerencia de Rutas</h1>
        <p className="text-muted-foreground">
          Obtén sugerencias de rutas de entrega optimizadas por IA basadas en condiciones en tiempo real.
        </p>
      </div>
      <SuggestionForm />
    </div>
  );
}
