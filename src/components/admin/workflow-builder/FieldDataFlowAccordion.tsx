import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { BRICK_COLORS } from './utils';
import type { FieldDataFlow } from './upstreamContext';

interface FieldDataFlowAccordionProps {
  flow: FieldDataFlow;
}

export function FieldDataFlowAccordion({ flow }: FieldDataFlowAccordionProps) {
  return (
    <Accordion type="multiple">
      {/* Receives section */}
      {flow.receives.length > 0 && (
        <AccordionItem value="receives" className="border-b-0">
          <AccordionTrigger className="py-2 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2">
              Receives
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                {flow.receives.reduce((sum, r) => sum + r.fields.length, 0)}
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              {flow.receives.map((upstream) => (
                <div key={upstream.nodeId} className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${BRICK_COLORS[upstream.brickCategory].badge}`}
                    >
                      {upstream.nodeLabel}
                    </span>
                  </div>
                  <div className="ml-1 space-y-0.5">
                    {upstream.fields.map((field) => (
                      <div key={field.name} className="flex items-center gap-2">
                        <code className="text-xs font-mono text-muted-foreground">
                          {field.name}
                        </code>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {field.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Outputs section */}
      <AccordionItem value="outputs" className="border-b-0">
        <AccordionTrigger className="py-2 text-sm font-semibold hover:no-underline">
          <span className="flex items-center gap-2">
            Outputs
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
              {flow.fields.length}
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            {flow.fields.map((entry) => (
              <div
                key={entry.field.name}
                className="rounded-md border p-2 space-y-1"
              >
                {/* Field name + type */}
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono font-medium">
                    {entry.field.name}
                  </code>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {entry.field.type}
                  </span>
                </div>

                {/* To */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
                  <span className="shrink-0">To:</span>
                  {entry.deliveredTo.length > 0 ? (
                    entry.deliveredTo.map((dt) => (
                      <span
                        key={dt.nodeId}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${BRICK_COLORS[dt.brickCategory].badge}`}
                      >
                        {dt.nodeLabel}
                      </span>
                    ))
                  ) : (
                    <span>&mdash;</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
