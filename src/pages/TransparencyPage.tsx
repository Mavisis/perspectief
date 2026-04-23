import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BiasTag } from "@/components/BiasIndicator";
import { outlets } from "@/lib/data";
import { BIAS_META, type BiasLabel } from "@/lib/types";
import { Shield, Eye, Scale } from "lucide-react";

const BIAS_ORDER: BiasLabel[] = ["left", "center-left", "center", "center-right", "right", "religious"];

export default function TransparencyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="container max-w-3xl py-12">
          <h1 className="font-headline text-3xl font-extrabold text-headline md:text-4xl">
            Transparantie
          </h1>
          <p className="mt-3 text-body font-body leading-relaxed">
            Perspectief labelt mediabronnen op basis van hun redactionele positie.
            Hieronder leggen we uit hoe en waarom.
          </p>

          {/* Principles */}
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Eye,
                title: "Bias is zichtbaar",
                text: "Elk medium heeft een perspectief. Wij maken het zichtbaar zodat je bewust kunt lezen.",
              },
              {
                icon: Shield,
                title: "Geen waarheid",
                text: "Wij bepalen niet wat waar is. Wij tonen hoe hetzelfde feit anders wordt ingekaderd.",
              },
              {
                icon: Scale,
                title: "Transparant",
                text: "Onze labels zijn openbaar en bespreekbaar. Ze zijn gebaseerd op publieke analyses.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-lg border border-divider bg-card p-5">
                <Icon className="mb-3 h-6 w-6 text-accent" />
                <h3 className="mb-1 font-headline text-base font-bold text-headline">{title}</h3>
                <p className="text-sm text-body font-body leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          {/* Bias scale */}
          <section className="mt-12">
            <h2 className="mb-2 font-headline text-2xl font-bold text-headline">
              Bias-schaal
            </h2>
            <p className="mb-6 text-sm text-caption font-body">
              Van links naar rechts, plus religieus als aparte categorie.
            </p>

            <div className="space-y-3">
              {BIAS_ORDER.map((bias) => (
                <div key={bias} className="flex items-center gap-4 rounded-lg border border-divider bg-card p-4">
                  <BiasTag bias={bias} size="md" />
                  <p className="text-sm text-body font-body">{BIAS_META[bias].description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Outlet mapping */}
          <section className="mt-12">
            <h2 className="mb-2 font-headline text-2xl font-bold text-headline">
              Bronnen & labels
            </h2>
            <p className="mb-6 text-sm text-caption font-body">
              Statische toewijzing op basis van publieke analyses en mediaonderzoek.
            </p>

            <div className="overflow-hidden rounded-lg border border-divider">
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-caption font-body">
                      Medium
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-caption font-body">
                      Label
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-caption font-body">
                      Beschrijving
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {outlets.map((outlet) => (
                    <tr key={outlet.id} className="bg-card">
                      <td className="px-4 py-3 font-body text-sm font-semibold text-headline">
                        {outlet.name}
                      </td>
                      <td className="px-4 py-3">
                        <BiasTag bias={outlet.bias} />
                      </td>
                      <td className="px-4 py-3 text-sm text-body font-body">
                        {BIAS_META[outlet.bias].description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Methodology */}
          <section className="mt-12 rounded-lg border border-divider bg-surface-warm p-6">
            <h2 className="mb-3 font-headline text-xl font-bold text-headline">
              Methodologie
            </h2>
            <div className="space-y-3 text-sm text-body font-body leading-relaxed">
              <p>
                <strong>Event-groepering:</strong> Artikelen worden gegroepeerd op basis van
                publicatiedatum en overeenkomende trefwoorden in de kop. Dit is een eenvoudige
                heuristiek — niet gebaseerd op machine learning.
              </p>
              <p>
                <strong>Bias-labels:</strong> Statisch toegewezen op basis van publiek beschikbare
                mediaanalyses, redactionele positionering, en zelfreflectie van de media zelf.
              </p>
              <p>
                <strong>Beperkingen:</strong> Bias is een spectrum, geen binair label. Individuele
                artikelen kunnen afwijken van het algemene profiel van een medium. Onze labels zijn
                een startpunt voor reflectie, geen definitief oordeel.
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
