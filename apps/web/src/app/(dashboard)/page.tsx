import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-6 py-16 space-y-16">
        {/* Hero Section */}
        <section className="text-center space-y-6 pt-12">
          <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-sm px-4 py-1">
            El sistema nervioso central de Yuno
          </Badge>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            Yuno Nexus
          </h1>

          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Convertimos las palabras del día uno en el revenue de mañana
          </p>
        </section>

        {/* Problem Statement */}
        <Card className="border-2 border-red-200 bg-white/80 backdrop-blur shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-red-700">El Problema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg text-slate-700 leading-relaxed">
              ¿Sabían que el <span className="font-bold text-red-600">80% de la información crítica</span> de un merchant se pierde entre la primera llamada de ventas y la implementación técnica?
            </p>
            <p className="text-slate-600">
              Esa "memoria perdida" nos cuesta <span className="font-semibold">semanas de retraso</span> y <span className="font-semibold">miles de dólares</span> en transacciones no procesadas.
            </p>
          </CardContent>
        </Card>

        {/* Solution */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-center text-slate-900">La Solución</h2>

          <Card className="border-2 border-indigo-200 bg-white/80 backdrop-blur shadow-xl">
            <CardContent className="pt-6 space-y-4">
              <p className="text-lg text-slate-700 leading-relaxed">
                Presentamos <span className="font-bold text-indigo-600">Yuno Nexus</span>, el sistema nervioso central que captura acuerdos, restricciones y necesidades técnicas desde la primera interacción en Slack, correos o llamadas.
              </p>
              <Separator />
              <p className="text-slate-700 leading-relaxed">
                Nexus no solo guarda datos; utiliza <span className="font-semibold">IA para transformar conversaciones informales en Blueprints de configuración automáticos</span>. Al eliminar el "teléfono roto", reducimos el tiempo de salida a producción y detectamos patrones de éxito para proponer proactivamente nuevos mercados al merchant.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Key Points */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-center text-slate-900">Puntos Clave</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-white/80 backdrop-blur hover:shadow-xl transition-shadow border-t-4 border-t-green-500">
              <CardHeader>
                <Badge className="w-fit bg-green-100 text-green-700 hover:bg-green-200 mb-2">
                  🚀 Día Cero
                </Badge>
                <CardTitle className="text-xl">Desde el Minuto Cero</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600 text-base">
                  Nexus empieza a trabajar <span className="font-semibold">antes del contrato</span>, cuando el merchant menciona por primera vez sus retos.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur hover:shadow-xl transition-shadow border-t-4 border-t-blue-500">
              <CardHeader>
                <Badge className="w-fit bg-blue-100 text-blue-700 hover:bg-blue-200 mb-2">
                  🎯 Zero-Reask
                </Badge>
                <CardTitle className="text-xl">Efecto "Zero-Reask"</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600 text-base">
                  El equipo técnico de Yuno <span className="font-semibold">no vuelve a preguntar</span> lo que ventas ya escuchó; la memoria está integrada.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur hover:shadow-xl transition-shadow border-t-4 border-t-purple-500">
              <CardHeader>
                <Badge className="w-fit bg-purple-100 text-purple-700 hover:bg-purple-200 mb-2">
                  📈 10x Scale
                </Badge>
                <CardTitle className="text-xl">Escalabilidad</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600 text-base">
                  Al automatizar la captura y sugerir patrones, permitimos atender a <span className="font-semibold">10x más clientes</span> con el mismo equipo.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center space-y-6 pb-12">
          <Card className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-0 shadow-2xl">
            <CardContent className="pt-8 pb-8 space-y-4">
              <h3 className="text-2xl font-bold">
                ¿Listo para transformar tu proceso de onboarding?
              </h3>
              <p className="text-indigo-100 max-w-2xl mx-auto">
                Únete a la revolución de Yuno Nexus y convierte cada conversación en valor real para tu negocio.
              </p>
              <div className="flex gap-4 justify-center pt-4">
                <Button size="lg" className="bg-white text-indigo-600 hover:bg-slate-100 font-semibold">
                  Comenzar Ahora
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Agendar Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}