"use client";
import { Accordion, AccordionItem, AccordionSummary, AccordionDetails } from "@/components/auto-index/edilozi-accordion/accordion";

export default function Demo() {
  return (
    <div className="flex min-h-[320px] w-full items-center justify-center overflow-auto p-6">
      <div className="w-full max-w-md">
        <Accordion>
          <AccordionItem value="one">
            <AccordionSummary>What is HigherBits.dev?</AccordionSummary>
            <AccordionDetails>A curated marketplace for original and MIT-licensed React UI components.</AccordionDetails>
          </AccordionItem>
          <AccordionItem value="two">
            <AccordionSummary>Can I use this commercially?</AccordionSummary>
            <AccordionDetails>Yes, every component here keeps its upstream MIT license intact.</AccordionDetails>
          </AccordionItem>
          <AccordionItem value="three">
            <AccordionSummary>Is it accessible?</AccordionSummary>
            <AccordionDetails>It uses native buttons and keyboard-focusable controls throughout.</AccordionDetails>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
