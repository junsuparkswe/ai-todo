"use client"

import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { toast } from "sonner"
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group"
import { PlusIcon } from "lucide-react"

const formSchema = z.object({
  text: z.string().min(1).max(200),
})

export function TodoInput() {
  const create = useMutation(api.todos.create)
  
  const form = useForm({
    defaultValues: {
      text: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await create(value)
        toast.success("Todo created")
        form.reset()
      } catch (error) {
        toast.error("Something went wrong")
        console.error(error)
      }
    },
  })

  return (
    <div className="w-full max-w-md">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        <form.Field name="text">
          {(field) => (
            <InputGroup className="h-10">
              <InputGroupInput
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="What needs to be done?"
                className="text-base"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton 
                  type="submit" 
                  size="sm" 
                  variant="default"
                  className="rounded-md"
                >
                  <PlusIcon data-icon="inline-start" />
                  Add
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          )}
        </form.Field>
      </form>
    </div>
  )
}
