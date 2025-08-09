import { useForm, UseFormReturn, FieldValues, DefaultValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form as ShadcnForm, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

// Form wrapper component that handles form state and validation
interface FormWrapperProps<T extends FieldValues> {
  schema: z.ZodSchema<T>
  defaultValues?: DefaultValues<T>
  onSubmit: (data: T) => void | Promise<void>
  children: (form: UseFormReturn<T>) => React.ReactNode
  className?: string
}

export function FormWrapper<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  className = ''
}: FormWrapperProps<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues
  })

  return (
    <ShadcnForm {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-6 ${className}`}>
        {children(form)}
      </form>
    </ShadcnForm>
  )
}

// Form field components for common input types
interface FormFieldProps {
  name: string
  label: string
  placeholder?: string
  description?: string
  required?: boolean
  className?: string
}

export function FormInput({ name, label, placeholder, description, required, className, ...props }: FormFieldProps & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FormField
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <Input
              placeholder={placeholder}
              {...field}
              {...props}
              value={field.value || ''}
            />
          </FormControl>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function FormTextarea({ name, label, placeholder, description, required, className, ...props }: FormFieldProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FormField
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <Textarea
              placeholder={placeholder}
              {...field}
              {...props}
              value={field.value || ''}
            />
          </FormControl>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

interface FormSelectProps extends FormFieldProps {
  options: { value: string; label: string }[]
  placeholder?: string
}

export function FormSelect({ name, label, options, placeholder = 'Select an option', description, required, className }: FormSelectProps) {
  return (
    <FormField
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <Select onValueChange={field.onChange} value={field.value || ''}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

interface FormCheckboxProps extends FormFieldProps {
  description?: string
}

export function FormCheckbox({ name, label, description, className }: FormCheckboxProps) {
  return (
    <FormField
      name={name}
      render={({ field }) => (
        <FormItem className={`flex flex-row items-start space-x-3 space-y-0 ${className}`}>
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel>{label}</FormLabel>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// Submit button component
interface FormSubmitProps {
  children: React.ReactNode
  loading?: boolean
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  className?: string
}

export function FormSubmit({ children, loading, variant = 'default', className }: FormSubmitProps) {
  return (
    <Button type="submit" variant={variant} disabled={loading} className={className}>
      {loading ? 'Loading...' : children}
    </Button>
  )
}