import PricingForm from './pricing-form';

export default function PricingPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Estimación de Precios</h1>
        <p className="text-muted-foreground">
          Calcula el costo aproximado de tus envíos de forma rápida y sencilla.
        </p>
      </div>
      <PricingForm />
    </div>
  );
}
