
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ConfiguracionPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">Administra la configuración de tu cuenta y de la aplicación.</p>
      </div>

      <Tabs defaultValue="cuenta" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
          <TabsTrigger value="cuenta">Cuenta</TabsTrigger>
          <TabsTrigger value="aplicacion">Aplicación</TabsTrigger>
          <TabsTrigger value="integraciones">Integraciones</TabsTrigger>
        </TabsList>
        
        <TabsContent value="cuenta">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Configuración de la Cuenta</CardTitle>
              <CardDescription>Actualiza tu información personal y preferencias.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" defaultValue="Usuario Ejemplo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="usuario@ejemplo.com" />
              </div>
              <Button>Guardar Cambios</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aplicacion">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Configuración de la Aplicación</CardTitle>
              <CardDescription>Ajusta el comportamiento general de la plataforma.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Opciones de configuración de la aplicación aparecerán aquí.</p>
              {/* Ej: Preferencias de notificación, unidades de medida, etc. */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integraciones">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Integraciones</CardTitle>
              <CardDescription>Conecta Rumbos Envios con otras herramientas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Supabase</CardTitle>
                    <CardDescription>Configura la conexión con tu base de datos Supabase.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">Deberás configurar manualmente las variables de entorno para Supabase (URL y Anon Key).</p>
                    <Button variant="outline" disabled>Conectar (Config. Manual)</Button>
                </CardContent>
              </Card>
               <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Google AI (Genkit)</CardTitle>
                    <CardDescription>Configuración para las funciones de IA.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">La API Key de Google AI se configura mediante variables de entorno.</p>
                     <Button variant="outline" disabled>Verificar Conexión (Automático)</Button>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
