import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Globe, Send, EyeOff, User, Mail, Phone, ArrowLeft, MapPin, Clock, CalendarDays } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { api, isApiAvailable } from '@/lib/api';
import buzonImg from '@/assets/buzon-sugerencias.png';
import logo from '@/assets/Logo2Liberamundo.png';
import { Link } from 'react-router-dom';

type Lang = 'es' | 'fr' | 'ar' | 'en' | 'ru';

const LANG_FLAGS: Record<Lang, string> = { es: '🇪🇸', fr: '🇫🇷', ar: '🇸🇦', en: '🇬🇧', ru: '🇷🇺' };
const LANG_LABELS: Record<Lang, string> = { es: 'Español', fr: 'Français', ar: 'العربية', en: 'English', ru: 'Русский' };

const TERMS: Record<Lang, { title: string; subtitle: string; terms: string; fields: Record<string, string>; submit: string; success: string; another: string; back: string; contact_note: string; optional: string }> = {
  es: {
    title: 'Buzón de sugerencias',
    subtitle: 'Tu opinión nos importa',
    terms: 'Este buzón es una herramienta para ayudarte a mejorar tu calidad de vida en el albergue. Nos preocupamos por tu situación y queremos escucharte. Los comentarios deben ser respetuosos y acordes a la convivencia de todos.',
    fields: {
      anonymous: 'Enviar de forma anónima',
      name: 'Tu nombre',
      message: 'Tu mensaje',
      messagePlaceholder: 'Escribe aquí tu sugerencia, petición o comentario...',
      room: 'Habitación',
      location: 'Lugar donde sucedió',
      locationPlaceholder: 'Ej: comedor, baño, pasillo...',
      time: 'Hora aproximada',
      date: 'Día en que sucedió',
      email: 'Email',
      phone: 'Teléfono',
    },
    submit: 'Enviar mensaje',
    success: '¡Mensaje enviado! Gracias por tu aportación.',
    another: 'Enviar otro mensaje',
    back: 'Volver al inicio',
    contact_note: 'Si deseas una respuesta, deja un medio de contacto',
    optional: 'Todos los campos son opcionales',
  },
  fr: {
    title: 'Boîte à suggestions',
    subtitle: 'Votre avis compte',
    terms: 'Cette boîte à suggestions est un outil pour améliorer votre qualité de vie. Nous nous soucions de votre situation et souhaitons vous écouter. Les commentaires doivent être respectueux et conformes à la cohabitation de tous.',
    fields: {
      anonymous: 'Envoyer anonymement',
      name: 'Votre nom',
      message: 'Votre message',
      messagePlaceholder: 'Écrivez ici votre suggestion, demande ou commentaire...',
      room: 'Chambre',
      location: 'Lieu de l\'événement',
      locationPlaceholder: 'Ex: réfectoire, salle de bain, couloir...',
      time: 'Heure approximative',
      date: 'Jour de l\'événement',
      email: 'E-mail',
      phone: 'Téléphone',
    },
    submit: 'Envoyer',
    success: 'Message envoyé ! Merci pour votre contribution.',
    another: 'Envoyer un autre message',
    back: 'Retour à l\'accueil',
    contact_note: 'Si vous souhaitez une réponse, laissez un moyen de contact',
    optional: 'Tous les champs sont facultatifs',
  },
  ar: {
    title: 'صندوق الاقتراحات',
    subtitle: 'رأيك يهمنا',
    terms: 'صندوق الاقتراحات هذا أداة لمساعدتك في تحسين جودة حياتك في المأوى. نحن نهتم بوضعك ونريد الاستماع إليك. يجب أن تكون التعليقات محترمة ومتوافقة مع التعايش الجماعي.',
    fields: {
      anonymous: 'إرسال مجهول الهوية',
      name: 'اسمك',
      message: 'رسالتك',
      messagePlaceholder: 'اكتب هنا اقتراحك أو طلبك أو تعليقك...',
      room: 'الغرفة',
      location: 'مكان الحدث',
      locationPlaceholder: 'مثال: المطعم، الحمام، الممر...',
      time: 'الوقت التقريبي',
      date: 'يوم الحدث',
      email: 'البريد الإلكتروني',
      phone: 'الهاتف',
    },
    submit: 'إرسال',
    success: 'تم إرسال الرسالة! شكراً لمساهمتك.',
    another: 'إرسال رسالة أخرى',
    back: 'العودة إلى الصفحة الرئيسية',
    contact_note: 'إذا كنت تريد رداً، اترك وسيلة اتصال',
    optional: 'جميع الحقول اختيارية',
  },
  en: {
    title: 'Suggestion Box',
    subtitle: 'Your opinion matters',
    terms: 'This suggestion box is a tool to help improve your quality of life at the shelter. We care about your situation and want to hear from you. Comments must be respectful and in accordance with communal living.',
    fields: {
      anonymous: 'Send anonymously',
      name: 'Your name',
      message: 'Your message',
      messagePlaceholder: 'Write your suggestion, request or comment here...',
      room: 'Room',
      location: 'Where it happened',
      locationPlaceholder: 'E.g. dining hall, bathroom, hallway...',
      time: 'Approximate time',
      date: 'Date it happened',
      email: 'Email',
      phone: 'Phone',
    },
    submit: 'Send message',
    success: 'Message sent! Thank you for your input.',
    another: 'Send another message',
    back: 'Back to home',
    contact_note: 'If you want a response, please leave contact information',
    optional: 'All fields are optional',
  },
  ru: {
    title: 'Ящик предложений',
    subtitle: 'Ваше мнение важно',
    terms: 'Этот ящик предложений — инструмент для улучшения качества вашей жизни в приюте. Мы заботимся о вашей ситуации и хотим вас выслушать. Комментарии должны быть уважительными и соответствовать правилам совместного проживания.',
    fields: {
      anonymous: 'Отправить анонимно',
      name: 'Ваше имя',
      message: 'Ваше сообщение',
      messagePlaceholder: 'Напишите здесь ваше предложение, просьбу или комментарий...',
      room: 'Комната',
      location: 'Где это произошло',
      locationPlaceholder: 'Напр.: столовая, ванная, коридор...',
      time: 'Примерное время',
      date: 'День события',
      email: 'Эл. почта',
      phone: 'Телефон',
    },
    submit: 'Отправить',
    success: 'Сообщение отправлено! Спасибо за ваш вклад.',
    another: 'Отправить ещё',
    back: 'На главную',
    contact_note: 'Если хотите получить ответ, оставьте контактные данные',
    optional: 'Все поля необязательны',
  },
};

export default function SugerenciasPublic() {
  const [lang, setLang] = useState<Lang>('es');
  const t = TERMS[lang];
  const isRtl = lang === 'ar';

  const [anonimo, setAnonimo] = useState(false);
  const [nombre, setNombre] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [habitacion, setHabitacion] = useState('');
  const [lugar, setLugar] = useState('');
  const [hora, setHora] = useState('');
  const [fecha, setFecha] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    setSending(true);
    try {
      // Build message with context info
      let fullMsg = mensaje;
      const extras: string[] = [];
      if (habitacion) extras.push(`Habitación: ${habitacion}`);
      if (lugar) extras.push(`Lugar: ${lugar}`);
      if (hora) extras.push(`Hora: ${hora}`);
      if (fecha) extras.push(`Fecha: ${fecha}`);
      if (extras.length > 0) fullMsg = `${fullMsg}\n\n---\n${extras.join(' | ')}`;

      const sugerencia = {
        id: crypto.randomUUID(),
        nombre: anonimo ? '' : nombre,
        anonimo,
        email,
        telefono,
        mensaje: fullMsg,
        fecha: new Date().toISOString(),
        leida: false,
        respuesta: '',
        traduccion: '',
      };

      const apiAvailable = await isApiAvailable();
      if (apiAvailable) {
        await api.addSugerencia('default', sugerencia);
      } else {
        // Fallback: save to localStorage
        const existing = JSON.parse(localStorage.getItem('sugerencias_default') || '[]');
        existing.unshift(sugerencia);
        localStorage.setItem('sugerencias_default', JSON.stringify(existing));
      }
      setSubmitted(true);
    } catch (err) {
      console.error('Error:', err);
      // Even on API error, save to localStorage as fallback
      try {
        const sugerencia = {
          id: crypto.randomUUID(),
          nombre: anonimo ? '' : nombre,
          anonimo,
          email,
          telefono,
          mensaje: mensaje,
          fecha: new Date().toISOString(),
          leida: false,
          respuesta: '',
          traduccion: '',
        };
        const existing = JSON.parse(localStorage.getItem('sugerencias_default') || '[]');
        existing.unshift(sugerencia);
        localStorage.setItem('sugerencias_default', JSON.stringify(existing));
        setSubmitted(true);
      } catch { /* ignore */ }
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setAnonimo(false);
    setNombre('');
    setMensaje('');
    setHabitacion('');
    setLugar('');
    setHora('');
    setFecha('');
    setEmail('');
    setTelefono('');
    setSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col items-center" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Language selector */}
      <div className="w-full max-w-lg flex justify-between items-center mb-4">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> {t.back}
          </Button>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              <Globe className="w-4 h-4" /> {LANG_FLAGS[lang]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(Object.keys(LANG_LABELS) as Lang[]).map(l => (
              <DropdownMenuItem key={l} onClick={() => setLang(l)} className={l === lang ? 'bg-accent' : ''}>
                {LANG_FLAGS[l]} {LANG_LABELS[l]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Header */}
      <div className="text-center mb-4 space-y-2">
        <img src={buzonImg} alt="Buzón" className="h-20 mx-auto" />
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground text-sm">{t.subtitle}</p>
      </div>

      {/* Terms - always visible, compact */}
      <Card className="w-full max-w-lg mb-4 border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">{t.terms}</p>
        </CardContent>
      </Card>

      {submitted ? (
        <Card className="w-full max-w-lg">
          <CardContent className="p-6 text-center space-y-4">
            <div className="text-5xl">✅</div>
            <h3 className="font-semibold text-lg">{t.success}</h3>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button onClick={reset} variant="outline">{t.another}</Button>
              <Link to="/"><Button variant="ghost">{t.back}</Button></Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-lg">
          <CardContent className="p-5 space-y-4">
            {/* Optional notice */}
            <p className="text-xs text-center text-muted-foreground italic">{t.optional}</p>

            {/* Anonymous toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                {anonimo ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <User className="w-4 h-4 text-primary" />}
                <Label className="text-sm cursor-pointer">{t.fields.anonymous}</Label>
              </div>
              <Switch checked={anonimo} onCheckedChange={setAnonimo} />
            </div>

            {/* Name */}
            {!anonimo && (
              <div className="space-y-1.5">
                <Label className="text-sm">{t.fields.name}</Label>
                <Input value={nombre} onChange={e => setNombre(e.target.value)} />
              </div>
            )}

            {/* Message */}
            <div className="space-y-1.5">
              <Label className="text-sm">{t.fields.message}</Label>
              <Textarea
                value={mensaje}
                onChange={e => setMensaje(e.target.value)}
                rows={4}
                placeholder={t.fields.messagePlaceholder}
                className="resize-none"
              />
            </div>

            {/* Context info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><MapPin className="w-3 h-3" /> {t.fields.room}</Label>
                <Input value={habitacion} onChange={e => setHabitacion(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><MapPin className="w-3 h-3" /> {t.fields.location}</Label>
                <Input value={lugar} onChange={e => setLugar(e.target.value)} placeholder={t.fields.locationPlaceholder} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> {t.fields.time}</Label>
                <Input type="time" value={hora} onChange={e => setHora(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {t.fields.date}</Label>
                <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="h-9 text-sm" />
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs text-muted-foreground italic">{t.contact_note}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1"><Mail className="w-3 h-3" /> {t.fields.email}</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1"><Phone className="w-3 h-3" /> {t.fields.phone}</Label>
                  <Input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} className="h-9 text-sm" />
                </div>
              </div>
            </div>

            <Button onClick={handleSubmit} disabled={sending} className="w-full gap-2" size="lg">
              <Send className="w-4 h-4" /> {t.submit}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 opacity-50">
        <img src={logo} alt="Libera Mundo" className="h-8" />
      </div>
    </div>
  );
}
