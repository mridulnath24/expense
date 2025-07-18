'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowLeft, AlertTriangle } from 'lucide-react';
import Logo from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import firebaseConfig from '@/lib/firebase-config.json';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.655-3.344-11.303-8H6.306C9.656,39.663,16.318,44,24,44z"/>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,35.531,44,29.891,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
  );

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#039be5" d="M24 5A19 19 0 1 0 24 43A19 19 0 1 0 24 5Z"></path>
        <path fill="#fff" d="M26.572,29.036h4.917l0.772-4.995h-5.69v-2.73c0-2.075,0.678-3.915,2.619-3.915h3.119v-4.359c-0.548-0.074-1.707-0.236-3.897-0.236c-4.573,0-7.254,2.415-7.254,7.917v3.323h-4.701v4.995h4.701v12.022c1.048,0.158,2.13,0.25,3.25,0.25c0.92,0,1.82-0.073,2.68-0.204V29.036z"></path>
    </svg>
);

const isFirebaseConfigured = firebaseConfig.apiKey !== 'YOUR_API_KEY';

export default function AuthPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const [view, setView] = useState<'tabs' | 'reset'>('tabs');
  const { t } = useLanguage();
  
  const { user, loading, signIn, signUp, signInWithGoogle, signInWithFacebook, sendPasswordReset } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const handleAuthAction = async (action: 'signIn' | 'signUp') => {
    setError('');
    setIsProcessing(true);
    try {
      if (action === 'signIn') {
        if (!email.trim() || !password.trim()) {
          setError('Email and password cannot be empty.');
          setIsProcessing(false);
          return;
        }
        await signIn(email, password);
      } else {
        if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
          setError('Please fill in all fields.');
          setIsProcessing(false);
          return;
        }
        await signUp(email, password, firstName, lastName);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsProcessing(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
        setIsProcessing(false);
    }
  };
  
  const handleFacebookSignIn = async () => {
    setError('');
    setIsProcessing(true);
    try {
      await signInWithFacebook();
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
        setIsProcessing(false);
    }
  };

  const handlePasswordReset = async () => {
    setError('');
    if (!email.trim()) {
        setError('Please enter your email address.');
        return;
    }
    setIsProcessing(true);
    try {
        await sendPasswordReset(email);
        toast({
            title: t('toast_passwordReset_title'),
            description: t('toast_passwordReset_desc'),
        });
        setView('tabs'); // Go back to login view on success
    } catch (err: any) {
        setError(err.message || 'Failed to send password reset email.');
    } finally {
        setIsProcessing(false);
    }
  };


  if (loading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mx-auto mb-6 text-center">
            <Logo />
            <h1 className="text-2xl font-bold mt-2">{t('signIn_welcome')}</h1>
            <p className="text-muted-foreground">
                {view === 'reset' ? t('signIn_resetPassword_tagline') : t('signIn_tagline')}
            </p>
        </div>

        {!isFirebaseConfigured && (
            <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Configuration Error</AlertTitle>
                <AlertDescription>
                   Firebase is not configured. Please add your project's credentials to{' '}
                   <code className="font-mono text-xs bg-destructive/20 p-1 rounded">src/lib/firebase-config.json</code>{' '}
                   to enable authentication.
                </AlertDescription>
            </Alert>
        )}

        {view === 'tabs' ? (
        <>
            <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin" disabled={!isFirebaseConfigured}>{t('signIn_tab')}</TabsTrigger>
                <TabsTrigger value="signup" disabled={!isFirebaseConfigured}>{t('signUp_tab')}</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
                <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                    <Label htmlFor="signin-email">{t('signIn_email_label')}</Label>
                    <Input id="signin-email" type="email" placeholder={t('signIn_email_placeholder')} value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="signin-password">{t('signIn_password_label')}</Label>
                            <Button variant="link" className="h-auto p-0 text-xs" onClick={() => { setView('reset'); setError(''); }}>
                                {t('signIn_forgotPassword_button')}
                            </Button>
                        </div>
                    <Input id="signin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                    <Button onClick={() => handleAuthAction('signIn')} disabled={isProcessing || !isFirebaseConfigured} className="w-full">
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('signIn_button')}
                    </Button>
                </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="signup">
                <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="signup-firstname">{t('signUp_firstName_label')}</Label>
                            <Input id="signup-firstname" placeholder={t('signUp_firstName_placeholder')} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="signup-lastname">{t('signUp_lastName_label')}</Label>
                            <Input id="signup-lastname" placeholder={t('signUp_lastName_placeholder')} value={lastName} onChange={(e) => setLastName(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="signup-email">{t('signUp_email_label')}</Label>
                    <Input id="signup-email" type="email" placeholder={t('signUp_email_placeholder')} value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="signup-password">{t('signUp_password_label')}</Label>
                    <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                    <Button onClick={() => handleAuthAction('signUp')} disabled={isProcessing || !isFirebaseConfigured} className="w-full">
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('signUp_createAccount_button')}
                    </Button>
                </CardContent>
                </Card>
            </TabsContent>
            </Tabs>
            
            <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">{t('orContinueWith')}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isProcessing || !isFirebaseConfigured}>
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-5 w-5"/>}
                    {t('google_button')}
                </Button>
                <Button variant="outline" className="w-full" onClick={handleFacebookSignIn} disabled={isProcessing || !isFirebaseConfigured}>
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FacebookIcon className="mr-2 h-5 w-5"/>}
                    {t('facebook_button')}
                </Button>
            </div>
        </>
        ) : (
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <p className="text-sm text-muted-foreground">{t('resetPassword_instructions')}</p>
                     <div className="space-y-2">
                        <Label htmlFor="reset-email">{t('resetPassword_email_label')}</Label>
                        <Input id="reset-email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                     {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                    <Button onClick={handlePasswordReset} disabled={isProcessing || !isFirebaseConfigured} className="w-full">
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('resetPassword_button')}
                    </Button>
                    <Button variant="link" className="w-full text-sm" onClick={() => { setView('tabs'); setError(''); }}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t('resetPassword_backToSignIn_button')}
                    </Button>
                </CardContent>
            </Card>
        )}
      </div>
    </main>
  );
}

    
