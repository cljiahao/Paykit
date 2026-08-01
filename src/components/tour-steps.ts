// Pure step config for the dashboard onboarding tour. No driver.js import here
// so it stays node-unit-testable; the controller maps these to driver's Config.

export type TourStep = {
  /** CSS selector for the element to spotlight. */
  element: string;
  title: string;
  description: string;
};

const sel = (tour: string) => `[data-tour="${tour}"]`;

// Desktop: nav links are visible, so we can spotlight each landmark.
const DESKTOP: TourStep[] = [
  {
    element: sel("tx-count"),
    title: "Your transaction activity",
    description:
      "Welcome to PayKit. Once customers start paying, this card tracks how many transactions you've processed this month.",
  },
  {
    element: sel("nav-config"),
    title: "Start here: Payment setup",
    description:
      "Add your PayNow details or your own payment link/QR. This is step one to accepting payments.",
  },
  {
    element: sel("nav-account"),
    title: "Your account",
    description:
      "Update your profile, check your plan, and manage billing here — shared across every Merqo kit you use.",
  },
  {
    element: sel("tour-replay"),
    title: "Replay anytime",
    description:
      "Tap here to run this tour again whenever you like. Now — go set up your payment method →",
  },
];

// Mobile: nav is collapsed behind the hamburger, so spotlight that instead of
// the hidden links (driver can't highlight an off-screen element).
const MOBILE: TourStep[] = [
  DESKTOP[0],
  {
    element: sel("nav-menu"),
    title: "Your sections",
    description:
      "Payment setup, transactions, stats, and your account menu live in here. Start with Payment setup to accept your first payment.",
  },
  DESKTOP[DESKTOP.length - 1],
];

/** The tour steps for the current layout. */
export function tourSteps(isMobile: boolean): TourStep[] {
  return isMobile ? MOBILE : DESKTOP;
}
