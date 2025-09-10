import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { instruction, targetUserId, originalLanguage } = await req.json()

    if (!instruction) {
      throw new Error('Instruction is required')
    }

    console.log('Processing admin instruction:', instruction.substring(0, 100))

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get admin info (hardcoded for sparksound2025@gmail.com)
    const { data: admin } = await supabaseClient
      .from('admins')
      .select('id')
      .eq('email', 'sparksound2025@gmail.com')
      .single()

    if (!admin) {
      throw new Error('Admin not found')
    }

    // Generate TTS for the instruction
    const ttsResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/text-to-speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        text: instruction,
        voice: 'alloy'
      })
    })

    let audioUrl = null
    if (ttsResponse.ok) {
      const ttsResult = await ttsResponse.json()
      audioUrl = `data:audio/mp3;base64,${ttsResult.audioContent}`
    }

    // Insert instruction into database
    const { data: insertResult, error } = await supabaseClient
      .from('instructions')
      .insert({
        admin_id: admin.id,
        target_user_id: targetUserId || null, // null means broadcast to all users
        original_text: instruction,
        original_language: originalLanguage || 'en-US',
        audio_url: audioUrl,
        status: 'pending'
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      throw new Error(`Failed to save instruction: ${error.message}`)
    }

    console.log('Instruction sent successfully:', insertResult)

    return new Response(
      JSON.stringify({ 
        success: true, 
        instructionId: insertResult[0].id,
        message: 'Instruction sent successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error in admin-send-instruction:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})

// Set function to be public (no JWT verification)