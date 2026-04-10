/**
 * Travel Planning — Formulaire public en 2 étapes
 * Palette Heldonica : blanc cassé, vert eucalyptus, sobre, mobile-first
 */
"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, Loader2, Mail, Calendar, Users, MapPin, Euro, MessageSquare, Leaf } from "lucide-react";

const TRAVEL_STYLES = [
  { id: "slow", label: "Slow travel" },
  { id: "offbeat", label: "Hors des sentiers battus" },
  { id: "eco", label: "Écoresponsable" },
  { id: "luxe", label: "Luxe discret" },
];

const DESTINATIONS = [
  "Portugal",
  "Espagne",
  "France",
  "Italie",
  "Grèce",
  "Croatie",
  "Autre",
];

export default function TravelPlanningPage() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form data
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    destination: "",
    departureDate: "",
    returnDate: "",
    travelers: "2",
    budget: "",
    travelStyles: [] as string[],
    message: "",
  });

  const createRequest = trpc.travelPlanning.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setSaving(false);
    },
    onError: () => {
      setSaving(false);
    },
  });

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleTravelStyle = (id: string) => {
    setForm((prev) => ({
      ...prev,
      travelStyles: prev.travelStyles.includes(id)
        ? prev.travelStyles.filter((s) => s !== id)
        : [...prev.travelStyles, id],
    }));
  };

  const handleSubmit = () => {
    setSaving(true);
    createRequest.mutate({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      destination: form.destination,
      departureDate: form.departureDate,
      returnDate: form.returnDate,
      travelers: form.travelers,
      budget: form.budget,
      travelType: form.travelStyles.join(", "),
      message: form.message,
    });
  };

  const isStep1Valid = () =>
    form.firstName && form.lastName && form.email && form.destination && form.departureDate && form.returnDate && form.travelers;

  const isStep2Valid = () => form.budget || form.message || form.travelStyles.length > 0;

  // Thank you screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FDFDF9] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-xl bg-white/80 backdrop-blur">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-[#6B9080] rounded-full flex items-center justify-center mx-auto mb-6">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-light text-[#2D3A3A] mb-4">
              Merci {form.firstName} !
            </h1>
            <p className="text-[#6B7A7A] leading-relaxed">
              On revient vers toi sous 48h 🌿
            </p>
            <p className="text-sm text-[#A0ABAAB] mt-4">
              Equipe Heldonica
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDF9] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full border-0 shadow-xl bg-white/90 backdrop-blur">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl font-light text-[#2D3A3A]">
            Voyage sur mesure
          </CardTitle>
          <CardDescription className="text-[#6B7A7A]">
            Étape {step} sur 2
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-[#2D3A3A]">Prénom</Label>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                    placeholder="Prénom"
                    className="border-[#E8E6E0] focus:border-[#6B9080]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-[#2D3A3A]">Nom</Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                    placeholder="Nom"
                    className="border-[#E8E6E0] focus:border-[#6B9080]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#2D3A3A]">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="votre@email.com"
                    className="pl-10 border-[#E8E6E0] focus:border-[#6B9080]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination" className="text-[#2D3A3A]">Destination</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <select
                    id="destination"
                    value={form.destination}
                    onChange={(e) => updateField("destination", e.target.value)}
                    className="w-full h-10 pl-10 pr-3 border border-[#E8E6E0] rounded-md bg-white focus:border-[#6B9080] focus:outline-none"
                  >
                    <option value="">Sélectionner une destination</option>
                    {DESTINATIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="departureDate" className="text-[#2D3A3A]">Départ</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="departureDate"
                      type="date"
                      value={form.departureDate}
                      onChange={(e) => updateField("departureDate", e.target.value)}
                      className="pl-10 border-[#E8E6E0] focus:border-[#6B9080]"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="returnDate" className="text-[#2D3A3A]">Retour</Label>
                  <Input
                    id="returnDate"
                    type="date"
                    value={form.returnDate}
                    onChange={(e) => updateField("returnDate", e.target.value)}
                    className="border-[#E8E6E0] focus:border-[#6B9080]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="travelers" className="text-[#2D3A3A]">Voyageurs</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <select
                    id="travelers"
                    value={form.travelers}
                    onChange={(e) => updateField("travelers", e.target.value)}
                    className="w-full h-10 pl-10 pr-3 border border-[#E8E6E0] rounded-md bg-white focus:border-[#6B9080] focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>{n} {n === 1 ? "voyageur" : "voyageurs"}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!isStep1Valid()}
                className="w-full bg-[#6B9080] hover:bg-[#5A7E70] text-white"
              >
                Suivant <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                className="text-[#6B7A7A] hover:text-[#6B9080]"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Retour
              </Button>

              <div className="space-y-2">
                <Label htmlFor="budget" className="text-[#2D3A3A]">Budget estimé</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <select
                    id="budget"
                    value={form.budget}
                    onChange={(e) => updateField("budget", e.target.value)}
                    className="w-full h-10 pl-10 pr-3 border border-[#E8E6E0] rounded-md bg-white focus:border-[#6B9080] focus:outline-none"
                  >
                    <option value="">Sélectionner un budget</option>
                    <option value="moins de 1500€">moins de 1500€</option>
                    <option value="1500-2500€">1500-2500€</option>
                    <option value="2500-4000€">2500-4000€</option>
                    <option value="4000-6000€">4000-6000€</option>
                    <option value="plus de 6000€">plus de 6000€</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#2D3A3A]">Style de voyage</Label>
                <div className="grid grid-cols-2 gap-2">
                  {TRAVEL_STYLES.map((style) => (
                    <div
                      key={style.id}
                      onClick={() => toggleTravelStyle(style.id)}
                      className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                        form.travelStyles.includes(style.id)
                          ? "border-[#6B9080] bg-[#6B9080]/5"
                          : "border-[#E8E6E0]"
                      }`}
                    >
                      <Checkbox
                        checked={form.travelStyles.includes(style.id)}
                        className="border-[#6B9080] data-[state=checked]:bg-[#6B9080]"
                      />
                      <span className="text-sm text-[#2D3A3A]">{style.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-[#2D3A3A]">Message libre</Label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="message"
                    value={form.message}
                    onChange={(e) => updateField("message", e.target.value)}
                    placeholder="Racontez-nous votre voyage idéal..."
                    rows={4}
                    className="pl-10 border-[#E8E6E0] focus:border-[#6B9080] resize-none"
                  />
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!isStep2Valid() || saving}
                className="w-full bg-[#6B9080] hover:bg-[#5A7E70] text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi...
                  </>
                ) : (
                  <>
                    Envoyer ma demande <Leaf className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}