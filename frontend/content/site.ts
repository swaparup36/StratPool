// Sample content shared across pages. Replace with your own.

export const companies = ["Lumen", "Orbit", "Fernway", "Stratus", "Tempo", "Beacon"];

export const plans = [
  {
    name: "Starter",
    price: "$10",
    features: [
      "Up to 10 team members.",
      "90 days of message history.",
      "Email support included.",
      "Basic team analytics.",
      "Core app integrations.",
    ],
  },
  {
    name: "Pro",
    price: "$20",
    featured: true,
    features: [
      "Unlimited team members.",
      "Unlimited message history.",
      "Priority email and chat support.",
      "Advanced analytics and exports.",
      "All integrations plus webhooks.",
    ],
  },
  {
    name: "Business",
    price: "$30",
    features: [
      "Everything in Pro.",
      "SSO and audit logs.",
      "Dedicated account manager.",
      "Custom retention policies.",
      "Full API access and SLA.",
    ],
  },
];

export type Testimonial = { quote: string; name: string; role: string; company: string; avatar: number };

export const homeTestimonials: Testimonial[] = [
  {
    quote: "Replacing three separate tools with Acme gave us our mornings back. Decisions now happen in minutes instead of meetings.",
    name: "Maya Torres",
    role: "Head of Product",
    company: "Beacon",
    avatar: 6,
  },
  {
    quote: "Everything we need lives in one place. We spend far less time looking for things and far more time improving the product.",
    name: "Daniel Okafor",
    role: "Engineering Lead",
    company: "Orbit",
    avatar: 5,
  },
  {
    quote: "Onboarding took an afternoon. By the end of the week, the entire company had moved its daily work across.",
    name: "Priya Nair",
    role: "Operations Manager",
    company: "Fernway",
    avatar: 3,
  },
  {
    quote: "It is rare for a tool to feel this quiet and still do this much. Our team genuinely enjoys using it every day.",
    name: "Tom Becker",
    role: "Founder",
    company: "Lumen",
    avatar: 4,
  },
];

export const insightsTestimonials: Testimonial[] = [
  {
    quote: "We used to find out about problems in the weekly status meeting. Now we see them as they happen.",
    name: "Hannah Lee",
    role: "Customer Success",
    company: "Tempo",
    avatar: 6,
  },
  {
    quote: "The live view changed how we run the team. It has removed a surprising number of check-ins from our week.",
    name: "Daniel Okafor",
    role: "Engineering Lead",
    company: "Orbit",
    avatar: 5,
  },
  {
    quote: "Being able to share a clear picture of progress with leadership has saved us hours of slide-making.",
    name: "Priya Nair",
    role: "Operations Manager",
    company: "Fernway",
    avatar: 3,
  },
];

export const pricingTestimonials: Testimonial[] = [
  { quote: "Our launches are noticeably smoother now. Everyone sees the same plan and the same status.", name: "Hannah Lee", role: "Customer Success", company: "Tempo", avatar: 6 },
  { quote: "We tried plenty of tools before this. Acme is the first one the whole team kept using.", name: "Marcus Reed", role: "IT Administrator", company: "Fernway", avatar: 4 },
  { quote: "Team communication is simply easier now, which is exactly what an agile team needs.", name: "Jess Alvarez", role: "Project Lead", company: "Stratus", avatar: 1 },
  { quote: "A must-have for us. We went from scattered updates to a clear picture of the work.", name: "Nina Volkov", role: "Operations Manager", company: "Lumen", avatar: 8 },
  { quote: "The minimal design keeps us focused. There is very little to learn and nothing in the way.", name: "Maya Torres", role: "Product Developer", company: "Beacon", avatar: 7 },
  { quote: "Our small team communicates effortlessly now, and we feel it in our release pace.", name: "Li Wen", role: "Finance Analyst", company: "Stratus", avatar: 2 },
  { quote: "Reporting that used to take an afternoon now takes a couple of clicks.", name: "Daniel Okafor", role: "Marketing Director", company: "Orbit", avatar: 5 },
  { quote: "Support answered every question within the hour during our rollout.", name: "Hannah Lee", role: "Customer Success", company: "Tempo", avatar: 3 },
  { quote: "Moving our archive across was far easier than we had feared.", name: "Marcus Reed", role: "IT Administrator", company: "Fernway", avatar: 4 },
];
