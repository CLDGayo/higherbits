/** @vitest-environment jsdom */
import { afterEach, expect, it, vi } from "vitest"
import React from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { PricingSection } from "@/components/features/pricing/pricing-section"
import { TIERS } from "@/app/pricing/page.client"
const state = vi.hoisted(() => ({frequency:"yearly", signIn:vi.fn()}))
vi.mock("jotai", () => ({atom:vi.fn(), useAtom:()=>[state.frequency,vi.fn()]}))
vi.mock("@number-flow/react", () => ({default:({value}:any)=>React.createElement("span",null,`$${value}`),NumberFlowGroup:({children}:any)=>children}))
vi.mock("@clerk/nextjs", () => ({useAuth:()=>({isSignedIn:false}),SignInButton:({children}:any)=>React.cloneElement(children,{onClick:state.signIn})}))
vi.mock("@/hooks/use-subscription", () => ({useSubscription:()=>({fetchSubscription:vi.fn()})}))
vi.mock("@/components/features/pricing/pricing-tab", () => ({pricingFrequencyAtom:{},PricingTabs:()=>null}))
vi.mock("@/components/features/pricing/plan-comparison-table", () => ({PlanComparisonTable:()=>null}))
vi.mock("@/components/features/pricing/faq", () => ({FAQ:()=>null}))
afterEach(()=>{cleanup();vi.clearAllMocks()})
function showPricing(authenticated=false,currentPlan:"free"|"pro"="free") {
  const onUpgrade=vi.fn(),onDowngrade=vi.fn()
  render(React.createElement(PricingSection,{frequencies:["yearly","monthly"],tiers:TIERS,currentPlan,currentFrequency:"yearly",isAuthenticated:authenticated,onUpgrade,onDowngrade}))
  return {onUpgrade,onDowngrade}
}
it.each(["monthly","yearly"])("Free beside Pro with truthful %s prices",frequency=>{
  state.frequency=frequency
  showPricing()
  expect(screen.getByRole("heading",{name:"Free"})).toBeTruthy()
  expect(screen.getByRole("heading",{name:"Pro"})).toBeTruthy()
  expect(screen.getByText("$0")).toBeTruthy()
  expect(screen.getByText(frequency==="monthly"?"$6":"$4")).toBeTruthy()
  expect(screen.getByText("Free forever")).toBeTruthy()
  expect(screen.getByText("2 shared copies per day · resets daily at 00:00 UTC")).toBeTruthy()
  expect(TIERS[1]!.features).toContain("Unlimited code copies")
})
it("anonymous Free CTA opens sign-in without billing",()=>{
  const actions=showPricing()
  fireEvent.click(screen.getByRole("button",{name:"Get started"}))
  expect(state.signIn).toHaveBeenCalledOnce()
  expect(actions.onUpgrade).not.toHaveBeenCalled()
  expect(actions.onDowngrade).not.toHaveBeenCalled()
})
it("signed-in Free is current and Pro's Free CTA only browses",()=>{
  showPricing(true)
  expect((screen.getByRole("button",{name:"Current Plan"}) as HTMLButtonElement).disabled).toBe(true)
  cleanup()
  const actions=showPricing(true,"pro")
  expect(screen.getByRole("link",{name:"Explore free components"}).getAttribute("href")).toBe("/")
  expect(actions.onUpgrade).not.toHaveBeenCalled()
  expect(actions.onDowngrade).not.toHaveBeenCalled()
})
import { COMPARISON_FEATURES, PLAN_FEATURES } from "../config/subscription-plans"
it("one shared usage row with UTC reset and unlimited Pro", () => {
  const comparison = COMPARISON_FEATURES.filter(row => row.section === "Usage")
  const features = PLAN_FEATURES.filter(row => row.category === "Usage")
  expect(comparison).toHaveLength(1)
  expect(features).toHaveLength(1)
  expect(comparison[0]!.name).toContain("CLI and MCP")
  expect(comparison[0]!.values).toEqual({free:"2 per day total · resets daily at 00:00 UTC",pro:"Unlimited"})
  expect(features[0]!.valueByPlan).toEqual(comparison[0]!.values)
})
