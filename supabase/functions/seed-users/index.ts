import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const mockUsers = [
  { email: 'sarah.chen@testco.com', password: '1testLOGin!', full_name: 'Sarah Chen', title: 'General Counsel', role: 'general_counsel' },
  { email: 'bobby.darin@testco.com', password: '1testLOGin!', full_name: 'Bobby Darin', title: 'Director of Legal Ops', role: 'legal_ops' },
  { email: 'michael.torres@testco.com', password: '1testLOGin!', full_name: 'Michael Torres', title: 'Legal Operations Manager', role: 'legal_ops' },
  { email: 'david.lee@testco.com', password: '1testLOGin!', full_name: 'David Lee', title: 'Contract Counsel', role: 'contract_counsel' },
  { email: 'john.smith@testco.com', password: '1testLOGin!', full_name: 'John Smith', title: 'Account Executive', role: 'account_executive' },
  { email: 'emily.johnson@testco.com', password: '1testLOGin!', full_name: 'Emily Johnson', title: 'Sales Manager', role: 'sales_manager' },
  { email: 'rachel.adams@testco.com', password: '1testLOGin!', full_name: 'Rachel Adams', title: 'Finance Reviewer', role: 'finance_reviewer' },
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const results = []

    for (const user of mockUsers) {
      console.log(`Creating user: ${user.email}`)
      
      // Create user with admin API
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name,
          title: user.title,
          role: user.role,
        },
      })

      if (error) {
        console.error(`Error creating ${user.email}:`, error.message)
        results.push({ email: user.email, success: false, error: error.message })
      } else {
        console.log(`Successfully created ${user.email}`)
        results.push({ email: user.email, success: true, id: data.user?.id })
      }
    }

    return new Response(
      JSON.stringify({ message: 'Seed completed', results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Seed error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
