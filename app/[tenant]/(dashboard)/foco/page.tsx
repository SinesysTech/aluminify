import React from 'react'
import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth'
import FocoClient from './client'

export const metadata: Metadata = {
    title: 'Modo Foco'
}

export default async function ModoFocoPage() {
    await requireUser()

    return <FocoClient />
}
