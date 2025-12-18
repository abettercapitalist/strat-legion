-- Create user_customizations table for storing theme preferences
CREATE TABLE public.user_customizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  sports_theme TEXT DEFAULT 'baseball',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_customizations ENABLE ROW LEVEL SECURITY;

-- Users can view their own customizations
CREATE POLICY "Users can view their own customizations" 
ON public.user_customizations 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own customizations
CREATE POLICY "Users can create their own customizations" 
ON public.user_customizations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own customizations
CREATE POLICY "Users can update their own customizations" 
ON public.user_customizations 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_customizations_updated_at
BEFORE UPDATE ON public.user_customizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();