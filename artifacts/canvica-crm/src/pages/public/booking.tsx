import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { CheckCircle2, Loader2, ArrowRight, Home, Building2, Calendar, CreditCard, Sparkles, MapPin } from "lucide-react";
import { 
  useCalculateQuotePublic, 
  useSubmitInquiry 
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const bookingSchema = z.object({
  serviceType: z.enum(["residential", "commercial"]),
  cleaningType: z.enum(["standard", "deep", "move_in_out", "post_construction", "recurring"]),
  frequency: z.enum(["one_time", "weekly", "biweekly", "monthly"]),
  propertyType: z.string().min(1, "Property type is required"),
  bedrooms: z.coerce.number().min(0).max(20),
  bathrooms: z.coerce.number().min(0).max(20),
  squareFootage: z.coerce.number().min(100, "Must be at least 100 sq ft").max(50000),
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Phone number is required"),
  address: z.string().min(5, "Address is required"),
  preferredDate: z.string().optional(),
  message: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export function BookingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [quoteEstimate, setQuoteEstimate] = useState<any>(null);

  const calculateQuote = useCalculateQuotePublic();
  const submitInquiry = useSubmitInquiry();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      serviceType: "residential",
      cleaningType: "standard",
      frequency: "one_time",
      propertyType: "Single Family Home",
      bedrooms: 3,
      bathrooms: 2,
      squareFootage: 1500,
      name: "",
      email: "",
      phone: "",
      address: "",
      message: "",
      preferredDate: "",
    },
  });

  const serviceType = form.watch("serviceType");
  const bedrooms = form.watch("bedrooms");
  const bathrooms = form.watch("bathrooms");
  const sqft = form.watch("squareFootage");
  const cleaningType = form.watch("cleaningType");
  const frequency = form.watch("frequency");

  // Debounced quote calculation
  useEffect(() => {
    if (sqft && sqft >= 100) {
      const timer = setTimeout(() => {
        calculateQuote.mutate({
          data: {
            serviceType,
            cleaningType,
            bedrooms: bedrooms || 0,
            bathrooms: bathrooms || 0,
            squareFootage: sqft,
            frequency,
            extras: []
          }
        }, {
          onSuccess: (data) => setQuoteEstimate(data),
          onError: () => setQuoteEstimate(null)
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [serviceType, cleaningType, bedrooms, bathrooms, sqft, frequency]);

  const onNextStep = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await form.trigger(["serviceType", "cleaningType", "propertyType", "bedrooms", "bathrooms", "squareFootage"]);
    } else if (step === 2) {
      isValid = await form.trigger(["frequency", "preferredDate"]);
    }
    
    if (isValid) {
      setStep((s) => (s + 1) as 1 | 2 | 3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const onSubmit = (data: BookingFormValues) => {
    submitInquiry.mutate({
      data: {
        ...data,
        referralSource: "Website Form"
      }
    }, {
      onSuccess: () => {
        toast({
          title: "Request Submitted!",
          description: "We'll email your finalized quote within 24 hours.",
        });
        setLocation("/");
      },
      onError: (err: any) => {
        toast({
          title: "Submission Failed",
          description: err?.message || "Please check your inputs and try again.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-80px)] py-12 lg:py-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 tracking-tight">Request an Instant Quote</h1>
          <p className="text-lg text-muted-foreground">Answer a few quick questions about your property and get an immediate price estimate.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2">
            {/* Steps indicator */}
            <div className="flex items-center justify-between mb-8 px-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex flex-col items-center gap-2 relative z-10 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                    step >= s ? "bg-primary text-white" : "bg-gray-200 text-gray-400"
                  }`}>
                    {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                  </div>
                  <span className={`text-xs font-medium uppercase tracking-wider hidden sm:block ${
                    step >= s ? "text-primary" : "text-muted-foreground"
                  }`}>
                    {s === 1 ? "Property Details" : s === 2 ? "Service Options" : "Contact Info"}
                  </span>
                  {s < 3 && (
                    <div className={`absolute top-5 left-1/2 w-full h-[2px] -z-10 ${
                      step > s ? "bg-primary" : "bg-gray-200"
                    }`} />
                  )}
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <form onSubmit={form.handleSubmit(onSubmit)} className="p-8">
                
                {/* STEP 1: Property Details */}
                {step === 1 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                      <Label className="text-base font-semibold mb-4 block">Property Type</Label>
                      <RadioGroup 
                        defaultValue={form.getValues("serviceType")} 
                        onValueChange={(val) => form.setValue("serviceType", val as any)}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                      >
                        <Label
                          htmlFor="type-res"
                          className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl cursor-pointer transition-all hover:bg-gray-50 ${
                            serviceType === 'residential' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200'
                          }`}
                        >
                          <RadioGroupItem value="residential" id="type-res" className="sr-only" />
                          <Home className="w-8 h-8 mb-3" />
                          <span className="font-semibold text-lg">Residential</span>
                          <span className="text-sm font-normal text-center mt-1 opacity-80">Homes, apartments, condos</span>
                        </Label>
                        <Label
                          htmlFor="type-com"
                          className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl cursor-pointer transition-all hover:bg-gray-50 ${
                            serviceType === 'commercial' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200'
                          }`}
                        >
                          <RadioGroupItem value="commercial" id="type-com" className="sr-only" />
                          <Building2 className="w-8 h-8 mb-3" />
                          <span className="font-semibold text-lg">Commercial</span>
                          <span className="text-sm font-normal text-center mt-1 opacity-80">Offices, retail, warehouses</span>
                        </Label>
                      </RadioGroup>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="propertyType">Specific Type</Label>
                        <Select onValueChange={(val) => form.setValue("propertyType", val)} defaultValue={form.getValues("propertyType")}>
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder="Select type..." />
                          </SelectTrigger>
                          <SelectContent>
                            {serviceType === 'residential' ? (
                              <>
                                <SelectItem value="Single Family Home">Single Family Home</SelectItem>
                                <SelectItem value="Apartment/Condo">Apartment/Condo</SelectItem>
                                <SelectItem value="Townhouse">Townhouse</SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem value="Office Space">Office Space</SelectItem>
                                <SelectItem value="Retail Store">Retail Store</SelectItem>
                                <SelectItem value="Restaurant">Restaurant</SelectItem>
                                <SelectItem value="Medical Facility">Medical Facility</SelectItem>
                                <SelectItem value="Other Commercial">Other Commercial</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="squareFootage">Approx. Square Footage <span className="text-red-500">*</span></Label>
                        <Input 
                          id="squareFootage" 
                          type="number" 
                          className="h-12 text-base" 
                          {...form.register("squareFootage")} 
                        />
                        {form.formState.errors.squareFootage && (
                          <p className="text-sm text-destructive">{form.formState.errors.squareFootage.message}</p>
                        )}
                      </div>
                    </div>

                    {serviceType === 'residential' && (
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="bedrooms">Bedrooms</Label>
                          <Select onValueChange={(val) => form.setValue("bedrooms", Number(val))} defaultValue={String(form.getValues("bedrooms"))}>
                            <SelectTrigger className="h-12 text-base">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {[0,1,2,3,4,5,6,7,8].map(n => (
                                <SelectItem key={`bed-${n}`} value={String(n)}>{n === 0 ? 'Studio (0)' : n}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bathrooms">Bathrooms</Label>
                          <Select onValueChange={(val) => form.setValue("bathrooms", Number(val))} defaultValue={String(form.getValues("bathrooms"))}>
                            <SelectTrigger className="h-12 text-base">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {[0,1,2,3,4,5,6,7,8].map(n => (
                                <SelectItem key={`bath-${n}`} value={String(n)}>{n}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    <div className="pt-6">
                      <Button type="button" onClick={onNextStep} size="lg" className="w-full text-lg h-14">
                        Continue to Service Options <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Service Options */}
                {step === 2 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                    <div>
                      <Label className="text-base font-semibold mb-4 block">Cleaning Package</Label>
                      <RadioGroup 
                        defaultValue={form.getValues("cleaningType")} 
                        onValueChange={(val) => form.setValue("cleaningType", val as any)}
                        className="grid grid-cols-1 gap-3"
                      >
                        {[
                          { id: "standard", label: "Standard Clean", desc: "Routine maintenance cleaning for well-kept spaces.", icon: Sparkles },
                          { id: "deep", label: "Deep Clean", desc: "Thorough top-to-bottom cleaning, including baseboards and inside windows.", icon: Sparkles },
                          { id: "move_in_out", label: "Move In/Out Clean", desc: "Empty property cleaning including inside cabinets and appliances.", icon: Home },
                          { id: "post_construction", label: "Post-Construction", desc: "Heavy dust and debris removal after renovations.", icon: Building2 },
                        ].map(pkg => (
                          <Label
                            key={pkg.id}
                            htmlFor={`pkg-${pkg.id}`}
                            className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-gray-50 ${
                              cleaningType === pkg.id ? 'border-primary bg-primary/5' : 'border-gray-200'
                            }`}
                          >
                            <RadioGroupItem value={pkg.id} id={`pkg-${pkg.id}`} className="mt-1" />
                            <div className="ml-4 flex-1">
                              <div className="font-semibold text-lg text-foreground">{pkg.label}</div>
                              <div className="text-sm text-muted-foreground mt-1">{pkg.desc}</div>
                            </div>
                            <pkg.icon className={`w-6 h-6 mt-1 ${cleaningType === pkg.id ? 'text-primary' : 'text-gray-400'}`} />
                          </Label>
                        ))}
                      </RadioGroup>
                    </div>

                    <div>
                      <Label className="text-base font-semibold mb-4 block">Frequency (Discount applied for recurring)</Label>
                      <RadioGroup 
                        defaultValue={form.getValues("frequency")} 
                        onValueChange={(val) => form.setValue("frequency", val as any)}
                        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                      >
                        {[
                          { id: "one_time", label: "One-Time" },
                          { id: "monthly", label: "Monthly" },
                          { id: "biweekly", label: "Bi-Weekly" },
                          { id: "weekly", label: "Weekly" },
                        ].map(freq => (
                          <Label
                            key={freq.id}
                            htmlFor={`freq-${freq.id}`}
                            className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer text-center transition-all hover:bg-gray-50 ${
                              frequency === freq.id ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-gray-200 font-medium'
                            }`}
                          >
                            <RadioGroupItem value={freq.id} id={`freq-${freq.id}`} className="sr-only" />
                            {freq.label}
                          </Label>
                        ))}
                      </RadioGroup>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="preferredDate">Preferred Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                        <Input 
                          id="preferredDate" 
                          type="date" 
                          className="pl-10 h-12 text-base" 
                          {...form.register("preferredDate")} 
                        />
                      </div>
                    </div>

                    <div className="pt-6 flex gap-4">
                      <Button type="button" variant="outline" onClick={() => setStep(1)} size="lg" className="h-14 px-8">Back</Button>
                      <Button type="button" onClick={onNextStep} size="lg" className="flex-1 text-lg h-14">
                        Final Step: Your Details <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Contact Details */}
                {step === 3 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                        <Input id="name" className="h-12" {...form.register("name")} />
                        {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                        <Input id="email" type="email" className="h-12" {...form.register("email")} />
                        {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                        <Input id="phone" type="tel" className="h-12" {...form.register("phone")} />
                        {form.formState.errors.phone && <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Service Address <span className="text-red-500">*</span></Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                          <Input id="address" className="pl-10 h-12" placeholder="123 Main St, City, ST 12345" {...form.register("address")} />
                        </div>
                        {form.formState.errors.address && <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Special Instructions or Notes (Optional)</Label>
                      <Textarea id="message" className="min-h-[120px] resize-none" {...form.register("message")} />
                    </div>

                    <div className="pt-6 flex flex-col sm:flex-row gap-4">
                      <Button type="button" variant="outline" onClick={() => setStep(2)} size="lg" className="h-14 px-8 w-full sm:w-auto">Back</Button>
                      <Button 
                        type="submit" 
                        size="lg" 
                        className="flex-1 text-lg h-14 bg-black text-white hover:bg-black/90 shadow-xl shadow-black/10"
                        disabled={submitInquiry.isPending}
                      >
                        {submitInquiry.isPending ? (
                          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting...</>
                        ) : (
                          "Request Formal Quote"
                        )}
                      </Button>
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                      No credit card required. A team member will review your details and send a finalized quote.
                    </p>
                  </div>
                )}

              </form>
            </div>
          </div>

          {/* Right Column: Dynamic Summary */}
          <div className="lg:col-span-1">
            <div className="bg-black text-white rounded-2xl shadow-xl p-8 sticky top-28">
              <h3 className="font-display font-semibold text-xl mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" /> Estimated Cost
              </h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-300">
                  <span>Service Type</span>
                  <span className="font-medium text-white capitalize">{serviceType}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Property</span>
                  <span className="font-medium text-white">{sqft ? `${sqft} sq ft` : '---'}</span>
                </div>
                {serviceType === 'residential' && (
                  <div className="flex justify-between text-gray-300">
                    <span>Rooms</span>
                    <span className="font-medium text-white">{bedrooms} Bed, {bathrooms} Bath</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-300">
                  <span>Package</span>
                  <span className="font-medium text-white capitalize">{cleaningType.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Frequency</span>
                  <span className="font-medium text-white capitalize">{frequency.replace('_', ' ')}</span>
                </div>
              </div>

              <Separator className="bg-white/20 mb-6" />
              
              <div className="space-y-4">
                {calculateQuote.isPending ? (
                  <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                    <span className="text-sm">Calculating estimate...</span>
                  </div>
                ) : quoteEstimate ? (
                  <>
                    <div className="flex justify-between text-gray-300">
                      <span>Base Rate</span>
                      <span>${quoteEstimate.basePrice.toFixed(2)}</span>
                    </div>
                    {quoteEstimate.discountAmount && quoteEstimate.discountAmount > 0 ? (
                      <div className="flex justify-between text-green-400">
                        <span>Recurring Discount</span>
                        <span>-${quoteEstimate.discountAmount.toFixed(2)}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between text-gray-300">
                      <span>Estimated Tax</span>
                      <span>${quoteEstimate.tax.toFixed(2)}</span>
                    </div>
                    <Separator className="bg-white/20 my-4" />
                    <div className="flex justify-between items-end">
                      <span className="text-lg font-medium">Estimated Total</span>
                      <span className="text-4xl font-bold text-primary">${quoteEstimate.total.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-4 text-center">
                      *This is an estimate based on average property conditions. Final price may vary upon inspection.
                    </p>
                  </>
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <p className="text-sm">Enter property size (sq ft) to see your instant estimate.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}