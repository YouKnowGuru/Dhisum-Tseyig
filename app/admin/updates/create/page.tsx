'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2, Package, Github, ExternalLink } from 'lucide-react'

export default function CreateUpdatePage() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        version: '',
        notes: '',
        downloadUrl: '',
        isLatest: 'false',
        fileUrl: '',
        fileSize: '',
        fileSha512: '',
        releaseDate: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)

        // Validate: downloadUrl must be provided
        if (!formData.downloadUrl) {
            setError('Please provide the GitHub Release download URL')
            setIsSubmitting(false)
            return
        }

        try {
            const response = await fetch('/api/updates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    fileUrl: formData.downloadUrl,
                    isLatest: formData.isLatest === 'true',
                    fileSize: formData.fileSize ? parseInt(formData.fileSize, 10) : undefined,
                }),
            })

            if (response.ok) {
                router.push('/admin/updates')
            } else {
                const data = await response.json()
                setError(data.error || 'Failed to create update')
            }
        } catch (err) {
            setError('An error occurred. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            <Link href="/admin/updates">
                <Button variant="ghost">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Updates
                </Button>
            </Link>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        New Software Update
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* GitHub Release Instructions */}
                    <div className="mb-6 p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                        <div className="flex items-center gap-2">
                            <Github className="h-5 w-5 text-bhutan-gold" />
                            <h3 className="text-sm font-black uppercase tracking-widest">Step 1: Upload to GitHub Releases</h3>
                        </div>
                        <p className="text-xs text-slate-300 font-medium leading-relaxed">
                            Files are hosted on GitHub Releases (free, up to 2GB per file). Upload your <code className="text-bhutan-gold">.exe</code> and <code className="text-bhutan-gold">latest.yml</code> as release assets, then paste the download URL below.
                        </p>
                        <a
                            href="https://github.com/YouKnowGuru/dhisum-pos-download/releases/new"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-black text-bhutan-gold hover:underline"
                        >
                            Open GitHub New Release Page
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="version">Version Number *</Label>
                                <Input
                                    id="version"
                                    value={formData.version}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, version: e.target.value })}
                                    placeholder="e.g., 1.0.5"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="isLatest">Mark as Latest? *</Label>
                                <Select
                                    value={formData.isLatest}
                                    onValueChange={(value: string) => setFormData({ ...formData, isLatest: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="false">No (Archive)</SelectItem>
                                        <SelectItem value="true">Yes (Active Version)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="downloadUrl">GitHub Release Download URL *</Label>
                            <Input
                                id="downloadUrl"
                                value={formData.downloadUrl}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, downloadUrl: e.target.value })}
                                placeholder="https://github.com/YouKnowGuru/dhisum-pos-download/releases/download/v1.0.5/Jinda.Setup.1.0.5.exe"
                                required
                            />
                            <p className="text-xs text-slate-500">
                                Paste the direct download URL from the GitHub release asset
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="fileSize">File Size (bytes) *</Label>
                                <Input
                                    id="fileSize"
                                    type="number"
                                    value={formData.fileSize}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, fileSize: e.target.value })}
                                    placeholder="205044958"
                                    required
                                />
                                <p className="text-xs text-slate-500">
                                    Find this in <code>release/latest.yml</code> after building
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="releaseDate">Release Date</Label>
                                <Input
                                    id="releaseDate"
                                    type="datetime-local"
                                    value={formData.releaseDate}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, releaseDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fileSha512">SHA-512 Hash (from latest.yml) *</Label>
                            <Input
                                id="fileSha512"
                                value={formData.fileSha512}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, fileSha512: e.target.value })}
                                placeholder="fB63VXa0Dr2f0fLI8lPz1Vp00x8l0tdPBEN7Nqf+TKAGGLNUXTjjxQjEPDv0vehXN8wf6xzSnIhcs8IJHwF+1A=="
                                required
                            />
                            <p className="text-xs text-slate-500">
                                Copy the sha512 value from <code>release/latest.yml</code> generated by electron-builder
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Release Notes *</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="What's new in this version?"
                                rows={5}
                                required
                            />
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
                                        Publishing...
                                    </>
                                ) : (
                                    'Publish Update'
                                )}
                            </Button>
                            <Link href="/admin/updates">
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
