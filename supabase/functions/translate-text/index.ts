import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Language code mapping
const languageCodeMap: Record<string, string> = {
  'en-US': 'en',
  'hi-IN': 'hi',
  'te-IN': 'te',
  'ta-IN': 'ta',
  'kn-IN': 'kn',  
  'ml-IN': 'ml',
  'en-IN': 'en'
}

// Simple fallback translations for common words
const fallbackTranslations: Record<string, Record<string, string>> = {
  'te': {
    'Hello': 'హలో',
    'Welcome': 'స్వాగతం',
    'Thank you': 'ధన్యవాదాలు',
    'Yes': 'అవును',
    'No': 'లేదు',
    'Good': 'మంచిది',
    'Bad': 'చెడు',
    'Help': 'సహాయం'
  },
  'ta': {
    'Hello': 'வணக்கம்',
    'Welcome': 'வரவேற்கிறோம்',
    'Thank you': 'நன்றி',
    'Yes': 'ஆம்',
    'No': 'இல்லை',
    'Good': 'நல்ல',
    'Bad': 'மோசமான',
    'Help': 'உதவி'
  },
  'hi': {
    'Hello': 'नमस्ते',
    'Welcome': 'स्वागत है',
    'Thank you': 'धन्यवाद',
    'Yes': 'हाँ',
    'No': 'नहीं',
    'Good': 'अच्छा',
    'Bad': 'बुरा',
    'Help': 'मदद'
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, targetLanguage, sourceLanguage } = await req.json()

    if (!text || !targetLanguage) {
      throw new Error('Text and target language are required')
    }

    console.log('Translating text from', sourceLanguage, 'to', targetLanguage, ':', text)

    // Map language codes
    const sourceLang = languageCodeMap[sourceLanguage] || 'en'
    const targetLang = languageCodeMap[targetLanguage] || 'en'

    // If source and target are the same, return original text
    if (sourceLang === targetLang) {
      console.log('Same language, returning original text')
      return new Response(
        JSON.stringify({ translatedText: text }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    let translatedText = text

    try {
      // Try MyMemory Translation API (free, reliable)
      const encodedText = encodeURIComponent(text)
      const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=${sourceLang}|${targetLang}`
      
      console.log('Calling MyMemory API:', myMemoryUrl)
      
      const response = await fetch(myMemoryUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'TranslateApp/1.0'
        }
      })

      if (response.ok) {
        const result = await response.json()
        console.log('MyMemory response:', result)
        
        if (result.responseData && result.responseData.translatedText) {
          translatedText = result.responseData.translatedText
          console.log('Translation successful via MyMemory:', translatedText)
        } else {
          throw new Error('Invalid response from MyMemory')
        }
      } else {
        throw new Error(`MyMemory API failed: ${response.status}`)
      }
    } catch (apiError) {
      console.log('MyMemory API failed, trying fallback:', apiError)
      
      // Fallback to simple translations for common words
      const cleanText = text.trim()
      if (fallbackTranslations[targetLang] && fallbackTranslations[targetLang][cleanText]) {
        translatedText = fallbackTranslations[targetLang][cleanText]
        console.log('Used fallback translation:', translatedText)
      } else {
        // Last resort: return original text with language indicator
        translatedText = `[${targetLang.toUpperCase()}] ${text}`
        console.log('Using language indicator fallback:', translatedText)
      }
    }

    return new Response(
      JSON.stringify({ translatedText }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error in translate-text:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})