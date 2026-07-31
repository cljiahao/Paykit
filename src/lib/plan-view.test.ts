import { describe, it, expect } from "vitest";
import { resolvePlanView, PRO_PRICE } from "./plan-view";

describe("PRO_PRICE", () => {
  it("is $12/mo", () => {
    expect(PRO_PRICE).toBe("$12/mo");
  });
});

describe("resolvePlanView", () => {
  it("labels a free vendor Free, singular count, no nudge, upgrade shown", () => {
    const view = resolvePlanView("free", 1);
    expect(view.planLabel).toBe("Free");
    expect(view.countLabel).toBe("1 transaction this month");
    expect(view.showNudge).toBe(false);
    expect(view.showUpgrade).toBe(true);
    expect(view.features).toEqual(["Unlimited transactions"]);
  });

  it("uses plural count copy for zero and for more than one", () => {
    expect(resolvePlanView("free", 0).countLabel).toBe(
      "0 transactions this month",
    );
    expect(resolvePlanView("free", 2).countLabel).toBe(
      "2 transactions this month",
    );
  });

  it("shows the Pro nudge once a free vendor crosses the usage threshold", () => {
    expect(resolvePlanView("free", 49).showNudge).toBe(false);
    expect(resolvePlanView("free", 50).showNudge).toBe(true);
  });

  it("labels a pro vendor Pro, lists Stats/Refunds, never nudges or upsells", () => {
    const view = resolvePlanView("pro", 500);
    expect(view.planLabel).toBe("Pro");
    expect(view.features).toEqual([
      "Unlimited transactions",
      "Stats",
      "Refunds",
    ]);
    expect(view.showNudge).toBe(false);
    expect(view.showUpgrade).toBe(false);
  });
});
