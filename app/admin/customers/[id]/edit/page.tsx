'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2, Users, Save } from 'lucide-react'
import { bhutanLocations, getAllRegions } from '@/lib/data/bhutanLocations'

export default function EditCustomerPage() {
    const router = useRouter()
    const params = useParams()
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: '',
        phone: '',
        street: '',
        gewog: '',
        dzongkhag: '',
    })

    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                const response = await fetch(`/api/admin/customers/${params.id}`)
                if (!response.ok) throw new Error('Failed to fetch customer')
                const data = await response.json()
                const customer = data.customer

                setFormData({
                    name: customer.name,
                    email: customer.email,
                    company: customer.company || '',
                    phone: customer.phone || '',
                    street: customer.address?.street || '',
                    gewog: customer.address?.gewog || '',
                    dzongkhag: customer.address?.dzongkhag || '',
                })
                setFieldErrors({})
            } catch (err) {
                setError('Failed to load customer details')
            } finally {
                setIsLoading(false)
            }
        }

        fetchCustomer()
    }, [params.id])

    const selectedDzongkhag = bhutanLocations.find(d => d.id === formData.dzongkhag)
    const availableGewogs = selectedDzongkhag?.gewogs || []

    const handleDzongkhagChange = (value: string) => {
        setFormData({ ...formData, dzongkhag: value, gewog: '' })
        if (fieldErrors.dzongkhag) setFieldErrors({ ...fieldErrors, dzongkhag: '', gewog: '' })
    }

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {}

        // Name validation
        if (!formData.name.trim()) {
            errors.name = 'Full name is required'
        } else if (formData.name.trim().length < 2) {
            errors.name = 'Name must be at least 2 characters'
        } else if (formData.name.length > 200) {
            errors.name = 'Name must be under 200 characters'
        }

        // Email validation
        if (!formData.email.trim()) {
            errors.email = 'Email address is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Please enter a valid email address'
        }

        // Phone validation (optional but if provided, must be valid)
        if (formData.phone && !/^\+?[0-9\s-]{8,20}$/.test(formData.phone)) {
            errors.phone = 'Please enter a valid phone number (8-20 digits, +, spaces, or hyphens)'
        }

        // Address street length validation
        if (formData.street && formData.street.length > 300) {
            errors.street = 'Street address must be under 300 characters'
        }

        setFieldErrors(errors)
        return Object.keys(errors).length === 0
    }

    const clearFieldError = (field: string) => {
        if (fieldErrors[field]) {
            setFieldErrors({ ...fieldErrors, [field]: '' })
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(false)

        if (!validateForm()) return

        setIsSubmitting(true)

        const payload = {
            name: formData.name.trim(),
            email: formData.email.toLowerCase().trim(),
            company: formData.company.trim(),
            phone: formData.phone.trim(),
            address: {
                street: formData.street.trim(),
                gewog: formData.gewog,
                dzongkhag: formData.dzongkhag,
            },
        }

        try {
            const response = await fetch(`/api/admin/customers/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (response.ok) {
                setSuccess(true)
                setTimeout(() => setSuccess(false), 3000)
            } else {
                const data = await response.json()
                setError(data.error || 'Failed to update customer')
            }
        } catch (err) {
            setError('An error occurred. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Link href="/admin/customers">
                <Button variant="ghost">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Customers
                </Button>
            </Link>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Edit Customer Details
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
                            <AlertDescription>Customer updated successfully!</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setFormData({ ...formData, name: e.target.value }); clearFieldError('name') }}
                                    className={fieldErrors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                    placeholder="Enter full name"
                                    required
                                />
                                {fieldErrors.name && <p className="text-sm text-red-500 font-medium">{fieldErrors.name}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setFormData({ ...formData, email: e.target.value }); clearFieldError('email') }}
                                    className={fieldErrors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                    placeholder="email@example.com"
                                    required
                                />
                                {fieldErrors.email && <p className="text-sm text-red-500 font-medium">{fieldErrors.email}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="company">Company Name</Label>
                            <Input
                                id="company"
                                value={formData.company}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, company: e.target.value })}
                                placeholder="Acme Inc."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setFormData({ ...formData, phone: e.target.value }); clearFieldError('phone') }}
                                className={fieldErrors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                placeholder="+975 17 123 456"
                            />
                            {fieldErrors.phone && <p className="text-sm text-red-500 font-medium">{fieldErrors.phone}</p>}
                        </div>

                        <div className="border-t pt-6 mt-6">
                            <h3 className="text-lg font-semibold mb-4">Address</h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="street">Street Address</Label>
                                    <Input
                                        id="street"
                                        value={formData.street}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setFormData({ ...formData, street: e.target.value }); clearFieldError('street') }}
                                        className={fieldErrors.street ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                        placeholder="Street, Building..."
                                    />
                                    {fieldErrors.street && <p className="text-sm text-red-500 font-medium">{fieldErrors.street}</p>}
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="dzongkhag">Dzongkhag</Label>
                                        <Select value={formData.dzongkhag} onValueChange={handleDzongkhagChange}>
                                            <SelectTrigger id="dzongkhag" className={fieldErrors.dzongkhag ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Select Dzongkhag" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {getAllRegions().map((region) => (
                                                    <SelectGroup key={region}>
                                                        <SelectLabel className="text-xs text-muted-foreground">{region}</SelectLabel>
                                                        {bhutanLocations
                                                            .filter((dz) => dz.region === region)
                                                            .map((dz) => (
                                                                <SelectItem key={dz.id} value={dz.id}>
                                                                    {dz.name}
                                                                </SelectItem>
                                                            ))}
                                                    </SelectGroup>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {fieldErrors.dzongkhag && <p className="text-sm text-red-500 font-medium">{fieldErrors.dzongkhag}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="gewog">Gewog</Label>
                                        <Select value={formData.gewog} onValueChange={(v) => setFormData({ ...formData, gewog: v })} disabled={!formData.dzongkhag}>
                                            <SelectTrigger id="gewog">
                                                <SelectValue placeholder="Select Gewog" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableGewogs.map((gewog) => (
                                                    <SelectItem key={gewog.id} value={gewog.id}>
                                                        {gewog.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button
                                type="submit"
                                className="flex-1"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                            <Link href={`/admin/customers/${params.id}`}>
                                <Button variant="outline" type="button">
                                    Cancel
                                </Button>
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
