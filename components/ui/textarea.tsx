import * as React from "react"

import { fieldControlClassName } from "@/lib/ui/field-control"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        fieldControlClassName,
        "field-sizing-content min-h-16 h-auto resize-y py-2",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
