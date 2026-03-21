import { Head, useForm } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Card, CardContent } from '@/Components/ui/card';
import EmojiPickerField from '@/Components/EmojiPickerField';
import ColorPicker, { COLOURS } from '@/Components/ColorPicker';
import { cn, guessNameFromEmoji } from '@/lib/utils';
import pluralize from 'pluralize';
import { PlusCircle, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { useState } from 'react';

const STEP_LABELS = ['Your family', 'Currency', 'Add kids'];

interface KidRow { name: string; color: string; balance: string; }

const CURRENCY_SYMBOLS = [
    { symbol: '$',  name: 'Dollar',  plural: 'Dollars'  },
    { symbol: '£',  name: 'Pound',   plural: 'Pounds'   },
    { symbol: '€',  name: 'Euro',    plural: 'Euros'    },
    { symbol: '¥',  name: 'Yen',     plural: 'Yen'      },
    { symbol: '₹',  name: 'Rupee',   plural: 'Rupees'   },
    { symbol: 'kr', name: 'Krone',   plural: 'Kroner'   },
    { symbol: 'Fr', name: 'Franc',   plural: 'Francs'   },
    { symbol: 'R',  name: 'Rand',    plural: 'Rand'     },
    { symbol: '₩',  name: 'Won',     plural: 'Won'      },
    { symbol: '₪',  name: 'Shekel',  plural: 'Shekels'  },
    { symbol: '₺',  name: 'Lira',    plural: 'Lira'     },
    { symbol: '₿',  name: 'Bitcoin', plural: 'Bitcoin'  },
] as const;

export default function OnboardingIndex() {
    const [step, setStep] = useState(0);
    const [currencyType, setCurrencyType] = useState<'real' | 'custom'>('real');
    const [selectedSymbolIdx, setSelectedSymbolIdx] = useState(0);

    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        currency_symbol: string;
        currency_name: string;
        currency_name_plural: string;
        use_integer_amounts: boolean;
        spenders: KidRow[];
    }>({
        name: '',
        currency_symbol: '$',
        currency_name: 'Dollar',
        currency_name_plural: 'Dollars',
        use_integer_amounts: false,
        spenders: [],
    });

    function selectSymbol(idx: number) {
        setSelectedSymbolIdx(idx);
        const p = CURRENCY_SYMBOLS[idx];
        setData(d => ({ ...d, currency_symbol: p.symbol, currency_name: p.name, currency_name_plural: p.plural }));
    }

    function switchCurrencyType(type: 'real' | 'custom') {
        setCurrencyType(type);
        if (type === 'real') {
            selectSymbol(selectedSymbolIdx);
        } else {
            setData(d => ({ ...d, currency_symbol: '', currency_name: '', currency_name_plural: '', use_integer_amounts: false }));
        }
    }

    function addKid() {
        const nextColor = COLOURS[data.spenders.length % COLOURS.length];
        setData('spenders', [...data.spenders, { name: '', color: nextColor, balance: '' }]);
    }

    function updateKid(idx: number, field: keyof KidRow, value: string) {
        setData('spenders', data.spenders.map((k, i) => i === idx ? { ...k, [field]: value } : k));
    }

    function removeKid(idx: number) {
        setData('spenders', data.spenders.filter((_, i) => i !== idx));
    }

    function next() {
        if (step < 2) setStep(s => s + 1);
        else submit();
    }

    function back() { setStep(s => s - 1); }

    function submit() {
        post(route('onboarding.store'));
    }

    const canProceedStep0 = data.name.trim().length > 0;
    const canProceedStep1 = currencyType === 'real' || (data.currency_symbol.trim().length > 0 && data.currency_name.trim().length > 0);
    // Step 2 (kids) is always skippable
    const canProceed = step === 0 ? canProceedStep0 : step === 1 ? canProceedStep1 : true;

    const currencyNameSingular = data.currency_name || 'unit';
    const currencyNamePlural   = data.currency_name_plural || (currencyNameSingular + 's');

    return (
        <>
            <Head title="Set up your family" />
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-lg">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <ApplicationLogo className="h-10 w-auto mx-auto" />
                        <h1 className="text-2xl font-bold mt-3">Welcome to Quiddo</h1>
                        <p className="text-muted-foreground text-sm mt-1">Let's get your family set up.</p>
                    </div>

                    {/* Step indicator */}
                    <div className="flex items-center justify-center mb-8 gap-1">
                        {STEP_LABELS.map((label, i) => (
                            <div key={i} className="flex items-center gap-1">
                                <div className={cn(
                                    'flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border-2 transition-colors',
                                    i < step  ? 'bg-primary border-primary text-primary-foreground' :
                                    i === step ? 'border-primary text-primary bg-background' :
                                    'border-border text-muted-foreground bg-background'
                                )}>
                                    {i + 1}
                                </div>
                                <span className={cn(
                                    'text-xs hidden sm:inline',
                                    i === step ? 'text-primary font-medium' : 'text-muted-foreground'
                                )}>{label}</span>
                                {i < STEP_LABELS.length - 1 && (
                                    <ChevronRight className="h-3 w-3 text-muted-foreground mx-0.5" />
                                )}
                            </div>
                        ))}
                    </div>

                    <Card>
                        <CardContent className="pt-6">
                            {/* Step 0: Family Name */}
                            {step === 0 && (
                                <div className="space-y-5">
                                    <div>
                                        <h2 className="text-lg font-semibold">Your family</h2>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Give your family a name. This is your workspace in Quiddo — everything
                                            belongs to a family: kids, accounts, chores, and goals.
                                        </p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="family-name">Family name</Label>
                                        <Input
                                            id="family-name"
                                            placeholder="e.g. The Smiths"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            autoFocus
                                            onKeyDown={e => e.key === 'Enter' && canProceedStep0 && next()}
                                        />
                                        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                                    </div>
                                    <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground space-y-1">
                                        <p className="font-medium text-foreground">What's a family?</p>
                                        <p>Your family is your shared workspace. Most families only need one, but you can create more for different arrangements — like shared custody or separate groups of kids.</p>
                                    </div>
                                </div>
                            )}

                            {/* Step 1: Currency */}
                            {step === 1 && (
                                <div className="space-y-5">
                                    <div>
                                        <h2 className="text-lg font-semibold">What do your kids earn?</h2>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Choose a currency for chore rewards and pocket money.
                                        </p>
                                    </div>

                                    {/* Type toggle */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['real', 'custom'] as const).map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => switchCurrencyType(type)}
                                                className={cn(
                                                    'px-4 py-3 rounded-lg border text-left transition-colors',
                                                    currencyType === type
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-border hover:border-primary/40'
                                                )}
                                            >
                                                <p className={cn('text-sm font-medium', currencyType === type ? 'text-primary' : '')}>
                                                    {type === 'real' ? '💵 Real money' : '⭐ Custom currency'}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {type === 'real' ? 'Dollars, pounds, euros, etc.' : 'Points, stars, gems, or anything'}
                                                </p>
                                            </button>
                                        ))}
                                    </div>

                                    {currencyType === 'real' && (
                                        <div className="space-y-2">
                                            <Label>Currency symbol</Label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {CURRENCY_SYMBOLS.map((p, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => selectSymbol(i)}
                                                        className={cn(
                                                            'flex items-center justify-center px-3 py-2.5 rounded-md border text-sm font-mono transition-colors',
                                                            selectedSymbolIdx === i
                                                                ? 'border-primary bg-primary/5 text-primary font-bold'
                                                                : 'border-border hover:border-primary/40'
                                                        )}
                                                    >
                                                        {p.symbol}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-xs text-muted-foreground pt-1">
                                                You can create accounts with different currencies later.
                                            </p>
                                        </div>
                                    )}

                                    {currencyType === 'custom' && (
                                        <div className="space-y-3">
                                            <div className="flex items-end gap-3">
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Symbol</Label>
                                                    <EmojiPickerField
                                                        value={data.currency_symbol}
                                                        defaultEmoji="💰"
                                                        onChange={e => setData('currency_symbol', e)}
                                                        onPickerChange={d => {
                                                            const name = guessNameFromEmoji(d.names);
                                                            setData(prev => ({
                                                                ...prev,
                                                                currency_symbol: d.emoji,
                                                                currency_name: name,
                                                                currency_name_plural: pluralize(name),
                                                            }));
                                                        }}
                                                        pickerAlign="left"
                                                    />
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <Label htmlFor="currency-name" className="text-xs">Name (singular)</Label>
                                                    <Input
                                                        id="currency-name"
                                                        value={data.currency_name}
                                                        onChange={e => setData('currency_name', e.target.value)}
                                                        placeholder="Star"
                                                    />
                                                    {errors.currency_name && <p className="text-xs text-destructive">{errors.currency_name}</p>}
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <Label htmlFor="currency-plural" className="text-xs">Plural (optional)</Label>
                                                    <Input
                                                        id="currency-plural"
                                                        value={data.currency_name_plural}
                                                        onChange={e => setData('currency_name_plural', e.target.value)}
                                                        placeholder={data.currency_name ? data.currency_name + 's' : 'Stars'}
                                                    />
                                                </div>
                                            </div>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={data.use_integer_amounts}
                                                    onChange={e => setData('use_integer_amounts', e.target.checked)}
                                                    className="rounded accent-primary"
                                                />
                                                <span className="text-sm">
                                                    Whole numbers only (e.g. 1 {currencyNameSingular}, not 0.50 {currencyNamePlural})
                                                </span>
                                            </label>
                                            {data.currency_name && (
                                                <p className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded">
                                                    Preview: {data.currency_symbol}1 {currencyNameSingular} · {data.currency_symbol}25 {currencyNamePlural}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                You can create accounts with different currencies later.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 2: Kids */}
                            {step === 2 && (
                                <div className="space-y-5">
                                    <div>
                                        <h2 className="text-lg font-semibold">Add your kids</h2>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Each kid gets their own account. You can set up pocket money and chores in the next steps — or add more kids later.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        {data.spenders.map((kid, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <ColorPicker
                                                    value={kid.color}
                                                    onChange={c => updateKid(idx, 'color', c)}
                                                />
                                                <Input
                                                    placeholder={`Kid ${idx + 1} name`}
                                                    value={kid.name}
                                                    onChange={e => updateKid(idx, 'name', e.target.value)}
                                                    className="flex-1"
                                                    autoFocus={idx === data.spenders.length - 1}
                                                />
                                                <div className="relative w-28 shrink-0">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                                                        {data.currency_symbol || '$'}
                                                    </span>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step={data.use_integer_amounts ? '1' : '0.01'}
                                                        placeholder="0"
                                                        value={kid.balance}
                                                        onChange={e => updateKid(idx, 'balance', e.target.value)}
                                                        className="pl-6"
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                                                    onClick={() => removeKid(idx)}
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>

                                    <Button type="button" variant="outline" size="sm" onClick={addKid} className="gap-1.5">
                                        <PlusCircle className="h-3.5 w-3.5" />
                                        Add a kid
                                    </Button>

                                    {data.spenders.length === 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            You can skip this and add kids later from the dashboard.
                                        </p>
                                    )}
                                    {errors['spenders.0.name'] && <p className="text-xs text-destructive">All kids need a name.</p>}
                                </div>
                            )}

                            {/* Navigation */}
                            <div className="flex items-center justify-between mt-8 pt-5 border-t">
                                <div>
                                    {step > 0 && (
                                        <Button type="button" variant="ghost" size="sm" onClick={back} className="gap-1">
                                            <ChevronLeft className="h-3.5 w-3.5" /> Back
                                        </Button>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    {step === 2 && (
                                        <Button
                                            type="button"
                                            variant="link"
                                            size="sm"
                                            className="text-muted-foreground"
                                            onClick={submit}
                                            disabled={processing}
                                        >
                                            Do this later
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        onClick={next}
                                        disabled={!canProceed || processing}
                                        className="gap-1.5"
                                    >
                                        {step < 2 ? (
                                            <>Continue <ChevronRight className="h-3.5 w-3.5" /></>
                                        ) : (
                                            'Create family'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
