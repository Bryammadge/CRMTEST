import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger(console.log));

// Supabase client helper
const getSupabaseClient = (serviceRole = false) => {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    serviceRole ? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! : Deno.env.get('SUPABASE_ANON_KEY')!
  );
};

// Auth middleware
const requireAuth = async (c: any, next: any) => {
  const token = c.req.header('Authorization')?.split(' ')[1];
  if (!token) {
    return c.json({ error: 'Unauthorized - No token provided' }, 401);
  }

  const supabase = getSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return c.json({ error: 'Unauthorized - Invalid token' }, 401);
  }

  c.set('user', user);
  await next();
};

// Permission check middleware
const requirePermission = (resource: string, action: string) => {
  return async (c: any, next: any) => {
    const user = c.get('user');
    const supabase = getSupabaseClient(true);

    // Get user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return c.json({ error: 'User profile not found' }, 403);
    }

    // Check permission
    const { data: permission } = await supabase
      .from('permissions')
      .select('allowed')
      .eq('role', profile.role)
      .eq('resource', resource)
      .eq('action', action)
      .single();

    if (!permission?.allowed) {
      return c.json({ error: `Forbidden - Missing permission: ${action} on ${resource}` }, 403);
    }

    c.set('userRole', profile.role);
    await next();
  };
};

// ==========================================
// AUTH ROUTES
// ==========================================

app.post('/make-server-15630662/auth/signup', async (c) => {
  try {
    const { email, password, full_name, role } = await c.req.json();

    if (!email || !password || !full_name || !role) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    if (!['admin', 'supervisor', 'agent'].includes(role)) {
      return c.json({ error: 'Invalid role' }, 400);
    }

    const supabase = getSupabaseClient(true);

    // Create user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since email server not configured
      user_metadata: { full_name, role }
    });

    if (error) {
      console.error('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        email,
        full_name,
        role,
        is_active: true
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return c.json({ error: 'Failed to create profile' }, 500);
    }

    return c.json({ 
      message: 'User created successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name,
        role
      }
    });
  } catch (error) {
    console.error('Signup exception:', error);
    return c.json({ error: 'Internal server error during signup' }, 500);
  }
});

// ==========================================
// LEADS ROUTES
// ==========================================

app.get('/make-server-15630662/leads', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const supabase = getSupabaseClient(true);

    // Get user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    let query = supabase
      .from('leads')
      .select(`
        *,
        campaign:campaigns(name, insurer),
        agent:profiles!assigned_agent(full_name, email),
        supervisor:profiles!assigned_supervisor(full_name, email)
      `)
      .order('created_at', { ascending: false });

    // Agents only see their own leads
    if (profile?.role === 'agent') {
      query = query.eq('assigned_agent', user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching leads:', error);
      return c.json({ error: 'Failed to fetch leads' }, 500);
    }

    return c.json({ leads: data || [] });
  } catch (error) {
    console.error('Exception fetching leads:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/make-server-15630662/leads', requireAuth, requirePermission('leads', 'create'), async (c) => {
  try {
    const user = c.get('user');
    const leadData = await c.req.json();
    const supabase = getSupabaseClient(true);

    const { data, error } = await supabase
      .from('leads')
      .insert({
        ...leadData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating lead:', error);
      return c.json({ error: 'Failed to create lead' }, 500);
    }

    // Log in history
    await supabase.from('lead_history').insert({
      lead_id: data.id,
      user_id: user.id,
      action: 'created',
      new_value: 'Lead created'
    });

    return c.json({ lead: data });
  } catch (error) {
    console.error('Exception creating lead:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.put('/make-server-15630662/leads/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const leadId = c.req.param('id');
    const updates = await c.req.json();
    const supabase = getSupabaseClient(true);

    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', leadId)
      .select()
      .single();

    if (error) {
      console.error('Error updating lead:', error);
      return c.json({ error: 'Failed to update lead' }, 500);
    }

    return c.json({ lead: data });
  } catch (error) {
    console.error('Exception updating lead:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/make-server-15630662/leads/:id/assign', requireAuth, requirePermission('leads', 'assign'), async (c) => {
  try {
    const user = c.get('user');
    const leadId = c.req.param('id');
    const { agent_id, supervisor_id } = await c.req.json();
    const supabase = getSupabaseClient(true);

    const { data, error } = await supabase
      .from('leads')
      .update({
        assigned_agent: agent_id,
        assigned_supervisor: supervisor_id
      })
      .eq('id', leadId)
      .select()
      .single();

    if (error) {
      console.error('Error assigning lead:', error);
      return c.json({ error: 'Failed to assign lead' }, 500);
    }

    // Log assignment
    await supabase.from('lead_history').insert({
      lead_id: leadId,
      user_id: user.id,
      action: 'assigned',
      new_value: `Assigned to agent: ${agent_id}`
    });

    return c.json({ lead: data });
  } catch (error) {
    console.error('Exception assigning lead:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.get('/make-server-15630662/leads/:id/history', requireAuth, async (c) => {
  try {
    const leadId = c.req.param('id');
    const supabase = getSupabaseClient(true);

    const { data, error } = await supabase
      .from('lead_history')
      .select(`
        *,
        user:profiles(full_name, email)
      `)
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching lead history:', error);
      return c.json({ error: 'Failed to fetch history' }, 500);
    }

    return c.json({ history: data || [] });
  } catch (error) {
    console.error('Exception fetching lead history:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==========================================
// CAMPAIGNS ROUTES
// ==========================================

app.get('/make-server-15630662/campaigns', requireAuth, async (c) => {
  try {
    const supabase = getSupabaseClient(true);

    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        creator:profiles!created_by(full_name),
        products(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching campaigns:', error);
      return c.json({ error: 'Failed to fetch campaigns' }, 500);
    }

    return c.json({ campaigns: data || [] });
  } catch (error) {
    console.error('Exception fetching campaigns:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/make-server-15630662/campaigns', requireAuth, requirePermission('campaigns', 'create'), async (c) => {
  try {
    const user = c.get('user');
    const campaignData = await c.req.json();
    const supabase = getSupabaseClient(true);

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        ...campaignData,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating campaign:', error);
      return c.json({ error: 'Failed to create campaign' }, 500);
    }

    return c.json({ campaign: data });
  } catch (error) {
    console.error('Exception creating campaign:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.put('/make-server-15630662/campaigns/:id', requireAuth, requirePermission('campaigns', 'update'), async (c) => {
  try {
    const campaignId = c.req.param('id');
    const updates = await c.req.json();
    const supabase = getSupabaseClient(true);

    const { data, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', campaignId)
      .select()
      .single();

    if (error) {
      console.error('Error updating campaign:', error);
      return c.json({ error: 'Failed to update campaign' }, 500);
    }

    return c.json({ campaign: data });
  } catch (error) {
    console.error('Exception updating campaign:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==========================================
// PRODUCTS ROUTES
// ==========================================

app.get('/make-server-15630662/products', requireAuth, async (c) => {
  try {
    const supabase = getSupabaseClient(true);

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        campaign:campaigns(name, insurer)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return c.json({ error: 'Failed to fetch products' }, 500);
    }

    return c.json({ products: data || [] });
  } catch (error) {
    console.error('Exception fetching products:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/make-server-15630662/products', requireAuth, requirePermission('products', 'create'), async (c) => {
  try {
    const productData = await c.req.json();
    const supabase = getSupabaseClient(true);

    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return c.json({ error: 'Failed to create product' }, 500);
    }

    return c.json({ product: data });
  } catch (error) {
    console.error('Exception creating product:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==========================================
// CALLS ROUTES
// ==========================================

app.post('/make-server-15630662/calls/start', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const { lead_id, phone_number, direction, sip_call_id } = await c.req.json();
    const supabase = getSupabaseClient(true);

    const { data, error } = await supabase
      .from('calls')
      .insert({
        lead_id,
        agent_id: user.id,
        phone_number,
        direction: direction || 'outbound',
        status: 'ringing',
        sip_call_id,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error starting call:', error);
      return c.json({ error: 'Failed to start call' }, 500);
    }

    // Update lead last contact
    await supabase
      .from('leads')
      .update({ last_contact_date: new Date().toISOString() })
      .eq('id', lead_id);

    return c.json({ call: data });
  } catch (error) {
    console.error('Exception starting call:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.put('/make-server-15630662/calls/:id/end', requireAuth, async (c) => {
  try {
    const callId = c.req.param('id');
    const { status, outcome, notes, answered_at } = await c.req.json();
    const supabase = getSupabaseClient(true);

    const ended_at = new Date().toISOString();

    // Calculate duration
    const { data: callData } = await supabase
      .from('calls')
      .select('started_at, answered_at')
      .eq('id', callId)
      .single();

    const startTime = new Date(callData?.started_at || '').getTime();
    const answerTime = answered_at ? new Date(answered_at).getTime() : null;
    const endTime = new Date(ended_at).getTime();

    const duration_seconds = Math.floor((endTime - startTime) / 1000);
    const talk_time_seconds = answerTime ? Math.floor((endTime - answerTime) / 1000) : 0;

    const { data, error } = await supabase
      .from('calls')
      .update({
        status: status || 'completed',
        outcome,
        notes,
        answered_at: answered_at || callData?.answered_at,
        ended_at,
        duration_seconds,
        talk_time_seconds
      })
      .eq('id', callId)
      .select()
      .single();

    if (error) {
      console.error('Error ending call:', error);
      return c.json({ error: 'Failed to end call' }, 500);
    }

    return c.json({ call: data });
  } catch (error) {
    console.error('Exception ending call:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.get('/make-server-15630662/calls', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const supabase = getSupabaseClient(true);

    // Get user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    let query = supabase
      .from('calls')
      .select(`
        *,
        agent:profiles!agent_id(full_name),
        lead:leads(first_name, last_name, phone)
      `)
      .order('started_at', { ascending: false })
      .limit(100);

    // Agents only see their calls
    if (profile?.role === 'agent') {
      query = query.eq('agent_id', user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching calls:', error);
      return c.json({ error: 'Failed to fetch calls' }, 500);
    }

    return c.json({ calls: data || [] });
  } catch (error) {
    console.error('Exception fetching calls:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==========================================
// SALES ROUTES
// ==========================================

app.post('/make-server-15630662/sales', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const saleData = await c.req.json();
    const supabase = getSupabaseClient(true);

    // Get product commission
    const { data: product } = await supabase
      .from('products')
      .select('base_commission')
      .eq('id', saleData.product_id)
      .single();

    const agent_commission = saleData.premium_amount * (product?.base_commission || 0) / 100;
    const supervisor_commission = agent_commission * 0.1; // 10% of agent commission

    const { data, error } = await supabase
      .from('sales')
      .insert({
        ...saleData,
        agent_id: user.id,
        agent_commission,
        supervisor_commission,
        status: 'pending',
        sale_date: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating sale:', error);
      return c.json({ error: 'Failed to create sale' }, 500);
    }

    // Update lead status to 'venta'
    await supabase
      .from('leads')
      .update({ status: 'venta' })
      .eq('id', saleData.lead_id);

    return c.json({ sale: data });
  } catch (error) {
    console.error('Exception creating sale:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.put('/make-server-15630662/sales/:id/validate', requireAuth, requirePermission('sales', 'validate'), async (c) => {
  try {
    const user = c.get('user');
    const saleId = c.req.param('id');
    const { status } = await c.req.json(); // 'validated' or 'rejected'
    const supabase = getSupabaseClient(true);

    const { data, error } = await supabase
      .from('sales')
      .update({
        status,
        validated_by: user.id,
        validated_at: new Date().toISOString()
      })
      .eq('id', saleId)
      .select()
      .single();

    if (error) {
      console.error('Error validating sale:', error);
      return c.json({ error: 'Failed to validate sale' }, 500);
    }

    // Update lead status
    const { data: sale } = await supabase
      .from('sales')
      .select('lead_id')
      .eq('id', saleId)
      .single();

    if (sale) {
      await supabase
        .from('leads')
        .update({ status: status === 'validated' ? 'venta_validada' : 'perdido' })
        .eq('id', sale.lead_id);
    }

    return c.json({ sale: data });
  } catch (error) {
    console.error('Exception validating sale:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.get('/make-server-15630662/sales', requireAuth, async (c) => {
  try {
    const user = c.get('user');
    const supabase = getSupabaseClient(true);

    // Get user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    let query = supabase
      .from('sales')
      .select(`
        *,
        agent:profiles!agent_id(full_name),
        product:products(name, type),
        lead:leads(first_name, last_name, phone)
      `)
      .order('sale_date', { ascending: false });

    // Agents only see their sales
    if (profile?.role === 'agent') {
      query = query.eq('agent_id', user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching sales:', error);
      return c.json({ error: 'Failed to fetch sales' }, 500);
    }

    return c.json({ sales: data || [] });
  } catch (error) {
    console.error('Exception fetching sales:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==========================================
// REPORTS ROUTES
// ==========================================

app.get('/make-server-15630662/reports/agent-performance', requireAuth, async (c) => {
  try {
    const supabase = getSupabaseClient(true);

    const { data, error } = await supabase.rpc('get_agent_performance');

    if (error) {
      // Fallback query if view doesn't exist
      const { data: agents } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'agent');

      const performance = await Promise.all((agents || []).map(async (agent) => {
        const { data: calls } = await supabase
          .from('calls')
          .select('id, duration_seconds')
          .eq('agent_id', agent.id);

        const { data: sales } = await supabase
          .from('sales')
          .select('id, agent_commission')
          .eq('agent_id', agent.id);

        return {
          agent_id: agent.id,
          full_name: agent.full_name,
          total_calls: calls?.length || 0,
          completed_calls: calls?.filter(c => c.duration_seconds > 0).length || 0,
          total_sales: sales?.length || 0,
          total_commission: sales?.reduce((sum, s) => sum + (parseFloat(s.agent_commission as any) || 0), 0) || 0,
          avg_call_duration: calls && calls.length > 0 
            ? Math.round(calls.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / calls.length)
            : 0
        };
      }));

      return c.json({ performance });
    }

    return c.json({ performance: data || [] });
  } catch (error) {
    console.error('Exception fetching agent performance:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.get('/make-server-15630662/reports/daily-summary', requireAuth, async (c) => {
  try {
    const supabase = getSupabaseClient(true);
    const today = new Date().toISOString().split('T')[0];

    const { data: calls } = await supabase
      .from('calls')
      .select('*')
      .gte('started_at', `${today}T00:00:00`)
      .lte('started_at', `${today}T23:59:59`);

    const { data: sales } = await supabase
      .from('sales')
      .select('*')
      .gte('sale_date', `${today}T00:00:00`)
      .lte('sale_date', `${today}T23:59:59`);

    const summary = {
      date: today,
      total_calls: calls?.length || 0,
      completed_calls: calls?.filter(c => c.status === 'completed').length || 0,
      total_sales: sales?.length || 0,
      pending_sales: sales?.filter(s => s.status === 'pending').length || 0,
      validated_sales: sales?.filter(s => s.status === 'validated').length || 0,
      total_revenue: sales?.reduce((sum, s) => sum + parseFloat(s.premium_amount as any), 0) || 0
    };

    return c.json({ summary });
  } catch (error) {
    console.error('Exception fetching daily summary:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==========================================
// USERS ROUTES (Admin only)
// ==========================================

app.get('/make-server-15630662/users', requireAuth, requirePermission('users', 'read'), async (c) => {
  try {
    const supabase = getSupabaseClient(true);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return c.json({ error: 'Failed to fetch users' }, 500);
    }

    return c.json({ users: data || [] });
  } catch (error) {
    console.error('Exception fetching users:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.put('/make-server-15630662/users/:id', requireAuth, requirePermission('users', 'update'), async (c) => {
  try {
    const userId = c.req.param('id');
    const updates = await c.req.json();
    const supabase = getSupabaseClient(true);

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return c.json({ error: 'Failed to update user' }, 500);
    }

    return c.json({ user: data });
  } catch (error) {
    console.error('Exception updating user:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Health check
app.get('/make-server-15630662/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

Deno.serve(app.fetch);
