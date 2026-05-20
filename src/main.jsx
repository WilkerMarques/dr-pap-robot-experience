import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Download,
  HeartPulse,
  Hospital,
  MessageCircleOff,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UsersRound,
} from 'lucide-react';
import './styles.css';

const AVATAR_SRC = '/dr-pap-avatar.png';

function formatWhatsappInput(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

const screens = {
  idle: 'idle',
  modules: 'modules',
  profile: 'profile',
  quiz: 'quiz',
  result: 'result',
  lead: 'lead',
  thanks: 'thanks',
};

const quizQuestions = [
  {
    title: 'Você acompanha indicadores hospitalares em tempo real?',
    options: [
      { label: 'Sim', score: 3 },
      { label: 'Parcialmente', score: 2 },
      { label: 'Não', score: 0 },
    ],
  },
  {
    title: 'Sua equipe consegue consultar informações do paciente de forma rápida, segura e sem depender de WhatsApp?',
    subtitle: 'Inclui comunicação interna e apoio de IA para localizar informações do paciente.',
    icon: MessageCircleOff,
    options: [
      { label: 'Sim, temos ferramenta própria', score: 3 },
      { label: 'Às vezes, mas não é padronizado', score: 1 },
      { label: 'Não, ainda dependemos do WhatsApp', score: 0 },
    ],
  },
  {
    title: 'Existe dificuldade para visualizar ocupação e produtividade?',
    icon: BarChart3,
    options: [
      { label: 'Não, visualizamos com facilidade', score: 3 },
      { label: 'Às vezes temos dificuldade', score: 1 },
      { label: 'Sim, é um desafio frequente', score: 0 },
    ],
  },
  {
    title: 'O hospital já usa IA para apoiar decisões e agilizar consultas?',
    options: [
      { label: 'Sim', score: 3 },
      { label: 'Estamos iniciando', score: 2 },
      { label: 'Ainda não', score: 0 },
    ],
  },
];

const modules = [
  { icon: Hospital, title: 'Gestão de UTI', text: 'Visão rápida de leitos, pacientes críticos e indicadores assistenciais.' },
  { icon: Stethoscope, title: 'Meu Plantão', text: 'Organização da rotina médica, enfermagem e técnico de enfermagem.' },
  { icon: ClipboardCheck, title: 'Gestão Cirúrgica', text: 'Escalas, ocupação, tempos cirúrgicos e checklists operacionais.' },
  { icon: BarChart3, title: 'Dashboard Executivo', text: 'Indicadores estratégicos para tomada de decisão da diretoria.' },
  { icon: HeartPulse, title: 'Deterioração Clínica', text: 'Apoio para identificar riscos e priorizar pacientes.' },
  { icon: MessageCircleOff, title: 'Comunicação + IA', text: 'Reduz WhatsApp, centraliza conversas e consulta dados do paciente com IA.' },
];

const profiles = [
  { title: 'Direção', text: 'Indicadores, custos, ocupação, produtividade e visão executiva em poucos cliques.' },
  { title: 'Médico', text: 'Rotina assistencial mais organizada, acesso rápido a informações e apoio à decisão.' },
  { title: 'Enfermagem', text: 'Comunicação centralizada, tarefas visíveis e menos retrabalho entre turnos.' },
  { title: 'TI', text: 'Integração com sistemas hospitalares, rastreabilidade e menos dependência de canais informais.' },
];

function App() {
  const [screen, setScreen] = useState(screens.idle);
  const [history, setHistory] = useState([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [lead, setLead] = useState({ nome: '', hospital: '', whatsapp: '' });
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSubmitError, setLeadSubmitError] = useState('');
  const [lastInteraction, setLastInteraction] = useState(Date.now());

  const go = (next) => {
    setHistory((prev) => [...prev, screen]);
    setScreen(next);
    setLastInteraction(Date.now());
  };

  const back = () => {
    setHistory((prev) => {
      const copy = [...prev];
      const previous = copy.pop() || screens.idle;
      setScreen(previous);
      return copy;
    });
    setLastInteraction(Date.now());
  };

  const reset = () => {
    setScreen(screens.idle);
    setHistory([]);
    setQuizIndex(0);
    setAnswers([]);
    setLeadSubmitError('');
    setLeadSubmitting(false);
    setLastInteraction(Date.now());
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const inactiveSeconds = (Date.now() - lastInteraction) / 1000;
      if (screen !== screens.idle && inactiveSeconds > 75) reset();
    }, 1000);
    return () => clearInterval(timer);
  }, [lastInteraction, screen]);

  const score = useMemo(() => answers.reduce((acc, item) => acc + item.score, 0), [answers]);
  const maxScore = quizQuestions.length * 3;
  const percentage = Math.round((score / maxScore) * 100);

  const answerQuiz = (option) => {
    const nextAnswers = [...answers, option];
    setAnswers(nextAnswers);
    if (quizIndex + 1 >= quizQuestions.length) {
      setScreen(screens.result);
    } else {
      setQuizIndex((current) => current + 1);
    }
    setLastInteraction(Date.now());
  };

  const submitLead = async (event) => {
    event.preventDefault();
    const whatsappDigits = lead.whatsapp.replace(/\D/g, '');
    if (whatsappDigits.length < 10) return;

    setLeadSubmitting(true);
    setLeadSubmitError('');

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: lead.nome,
          hospital: lead.hospital,
          whatsapp: whatsappDigits,
          maturidade: percentage || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar');
      }

      setScreen(screens.thanks);
    } catch {
      setLeadSubmitError('Não foi possível enviar. Tente novamente.');
    } finally {
      setLeadSubmitting(false);
    }
  };

  const startQuiz = () => {
    setQuizIndex(0);
    setAnswers([]);
    go(screens.quiz);
  };

  return (
    <main className="tablet-app" onPointerDown={() => setLastInteraction(Date.now())}>
      <motion.div className="tablet-viewport">
        <AnimatePresence mode="wait">
          {screen === screens.idle && <Idle key="idle" onStart={startQuiz} />}
          {screen === screens.modules && <Modules key="modules" onBack={back} />}
          {screen === screens.profile && <Profile key="profile" onBack={back} />}
          {screen === screens.quiz && (
            <Quiz key="quiz" onBack={back} index={quizIndex} onAnswer={answerQuiz} />
          )}
          {screen === screens.result && <Result key="result" percentage={percentage} onBack={back} onLead={() => go(screens.lead)} />}
          {screen === screens.lead && (
            <Lead
              key="lead"
              onBack={back}
              lead={lead}
              setLead={setLead}
              submitLead={submitLead}
              submitting={leadSubmitting}
              submitError={leadSubmitError}
              onClearSubmitError={() => setLeadSubmitError('')}
            />
          )}
          {screen === screens.thanks && <Thanks key="thanks" reset={reset} />}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}

function Page({ children, className = '', onClick }) {
  return (
    <motion.section
      className={`page ${className}`}
      onClick={onClick}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.22 }}
    >
      {children}
    </motion.section>
  );
}

function Avatar({ size = 'header' }) {
  return (
    <div className={`avatar-wrap avatar-wrap--${size}`}>
      <img src={AVATAR_SRC} alt="Dr. PAP" className="avatar-img" draggable={false} />
    </div>
  );
}

function Header({ title, subtitle, onBack }) {
  return (
    <header className="header">
      {onBack && (
        <button type="button" className="icon-btn" onClick={onBack} aria-label="Voltar">
          <ArrowLeft size={28} />
        </button>
      )}
      <div className="plus">+</div>
      <Avatar size="header" />
      <p className="step">{subtitle}</p>
      <h1>{title}</h1>
    </header>
  );
}

function Idle({ onStart }) {
  const handleStart = (event) => {
    event.stopPropagation();
    onStart();
  };

  return (
    <Page className="idle-page" onClick={onStart}>
      <div className="start-screen-stage">
        <div className="start-screen">
          <div className="avatar-wrapper">
            <img src={AVATAR_SRC} alt="Dr. PAP" draggable={false} />
          </div>
          <p className="title-small">Olá, eu sou</p>
          <h1 className="title-main">o Dr. PAP</h1>
          <p className="subtitle">
            Toque na tela para conhecer
            <br />
            nossas soluções hospitalares
          </p>
          <button type="button" className="start-button" onClick={handleStart}>
            Começar
          </button>
        </div>
      </div>
    </Page>
  );
}

function Modules({ onBack }) {
  return (
    <Page>
      <Header title="Soluções hospitalares" subtitle="Módulos Dr. PAP" onBack={onBack} />
      <div className="cards-grid scroll-area">
        {modules.map(({ icon: Icon, title, text }) => (
          <div className="module-card" key={title}>
            <Icon size={28} />
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          </div>
        ))}
      </div>
    </Page>
  );
}

function Profile({ onBack }) {
  return (
    <Page>
      <Header title="Escolha seu perfil" subtitle="Simulação" onBack={onBack} />
      <div className="profile-list scroll-area">
        {profiles.map((profile) => (
          <div className="profile-card" key={profile.title}>
            <UsersRound size={28} />
            <h3>{profile.title}</h3>
            <p>{profile.text}</p>
          </div>
        ))}
      </div>
    </Page>
  );
}

function Quiz({ onBack, index, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const question = quizQuestions[index];
  const progress = ((index + 1) / quizQuestions.length) * 100;

  useEffect(() => {
    setSelected(null);
  }, [index]);

  const handleNext = () => {
    if (selected) onAnswer(selected);
  };

  return (
    <Page className="quiz-page">
      <div className="quiz-screen-stage">
        <div className="quiz-screen">
          <button type="button" className="quiz-back" onClick={onBack} aria-label="Voltar">
            <ArrowLeft size={32} />
          </button>
          <header className="quiz-header">
            <Avatar size="quiz" />
            <div className="quiz-header-text">
              <h1 className="quiz-heading">Diagnóstico rápido do seu hospital</h1>
            </div>
            <span className="quiz-plus" aria-hidden>+</span>
          </header>

          <p className="quiz-progress-label">
            Pergunta {index + 1} de {quizQuestions.length}
          </p>
          <div className="quiz-progress">
            <div style={{ width: `${progress}%` }} />
          </div>

          <h2 className="quiz-question">{question.title}</h2>
          {question.subtitle && <p className="quiz-subtitle">{question.subtitle}</p>}

          <div className="quiz-answers">
            {question.options.map((option) => (
              <button
                type="button"
                key={option.label}
                className={`quiz-answer${selected?.label === option.label ? ' is-selected' : ''}`}
                onClick={() => setSelected(option)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="quiz-next"
            disabled={!selected}
            onClick={handleNext}
          >
            Próxima
          </button>
        </div>
      </div>
    </Page>
  );
}

function Result({ percentage, onBack, onLead }) {
  const message = percentage >= 70
    ? 'Seu hospital já demonstra boa maturidade digital.'
    : percentage >= 40
      ? 'Existe uma boa oportunidade para evoluir processos e comunicação.'
      : 'Seu hospital pode ganhar muito com integração, indicadores e comunicação segura.';
  return (
    <Page className="result-page">
      <motion.div
        className="result-screen-stage"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.28 }}
      >
        <div className="result-screen">
          <button type="button" className="result-back" onClick={onBack} aria-label="Voltar">
            <ArrowLeft size={32} />
          </button>

          <motion.div className="result-main">
            <motion.div
              className="result-hero"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.06 }}
            >
              <motion.div
                className="result-hero-icon"
                aria-hidden
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.12 }}
              >
                <Sparkles size={36} />
              </motion.div>
              <p className="result-label">Resultado</p>
              <p className="result-score" aria-live="polite">{percentage}%</p>
              <h1 className="result-heading">Maturidade digital</h1>
              <p className="result-message">{message}</p>
            </motion.div>

            <motion.div
              className="result-insight"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.18 }}
            >
              <ShieldCheck size={32} aria-hidden />
              <p>
                Com comunicação centralizada e IA, sua equipe reduz WhatsApp, melhora
                rastreabilidade e consulta informações do paciente com mais agilidade.
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            className="result-cta-wrap"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.26 }}
          >
            <button type="button" className="result-cta" onClick={onLead}>
              Receber demonstração
            </button>
          </motion.div>
        </div>
      </motion.div>
    </Page>
  );
}

function Lead({
  onBack,
  lead,
  setLead,
  submitLead,
  submitting,
  submitError,
  onClearSubmitError,
}) {
  const [whatsappError, setWhatsappError] = useState(false);
  const update = (field) => (event) => {
    onClearSubmitError();
    const raw = event.target.value;
    const value = field === 'whatsapp' ? raw : raw.toUpperCase();
    setLead((prev) => ({ ...prev, [field]: value }));
  };

  const handleWhatsappChange = (event) => {
    setWhatsappError(false);
    onClearSubmitError();
    setLead((prev) => ({ ...prev, whatsapp: formatWhatsappInput(event.target.value) }));
  };

  const handleSubmit = (event) => {
    const whatsappDigits = lead.whatsapp.replace(/\D/g, '');
    if (whatsappDigits.length < 10) {
      event.preventDefault();
      setWhatsappError(true);
      return;
    }
    setWhatsappError(false);
    submitLead(event);
  };

  return (
    <Page className="lead-page">
      <div className="lead-screen-stage">
        <div className="lead-screen">
          <button type="button" className="lead-back" onClick={onBack} aria-label="Voltar">
            <ArrowLeft size={32} />
          </button>

          <header className="lead-header">
            <h1 className="lead-title">Receba uma demonstração</h1>
            <p className="lead-subtitle">
              Preencha seus dados para agendarmos uma conversa personalizada.
            </p>
          </header>

          <form className="lead-form" onSubmit={handleSubmit} noValidate>
            <label className="lead-field">
              <span className="lead-label">Nome</span>
              <input
                type="text"
                name="nome"
                autoComplete="name"
                placeholder="SEU NOME COMPLETO"
                value={lead.nome}
                onChange={update('nome')}
                required
              />
            </label>

            <label className="lead-field">
              <span className="lead-label">Hospital / Empresa</span>
              <input
                type="text"
                name="hospital"
                autoComplete="organization"
                placeholder="NOME DO HOSPITAL OU EMPRESA"
                value={lead.hospital}
                onChange={update('hospital')}
                required
              />
            </label>

            <label className={`lead-field${whatsappError ? ' lead-field--error' : ''}`}>
              <span className="lead-label">WhatsApp</span>
              <input
                type="tel"
                name="whatsapp"
                autoComplete="tel"
                inputMode="numeric"
                placeholder="(00) 00000-0000"
                value={lead.whatsapp}
                onChange={handleWhatsappChange}
                aria-invalid={whatsappError}
                required
              />
              {whatsappError && (
                <span className="lead-field-error">Informe um WhatsApp válido com DDD</span>
              )}
            </label>

            {submitError && (
              <p className="lead-submit-error" role="alert">
                {submitError}
              </p>
            )}

            <button type="submit" className="lead-submit" disabled={submitting}>
              {submitting ? 'Enviando...' : 'Quero uma demonstração'}
              {!submitting && <Send size={28} aria-hidden />}
            </button>
          </form>

          <p className="lead-safe-note">
            <ShieldCheck size={24} aria-hidden />
            Nossa equipe entrará em contato
          </p>
        </div>
      </div>
    </Page>
  );
}

function Thanks({ reset }) {
  return (
    <Page className="thanks-page">
      <CheckCircle2 size={80} />
      <h1>Obrigado!</h1>
      <p>Seu contato foi registrado. Nossa equipe vai chamar você para uma demonstração.</p>
      <button type="button" className="primary large" onClick={reset}>Voltar ao início</button>
      <ExportLeads />
    </Page>
  );
}

function ExportLeads() {
  const exportCsv = () => {
    const leads = JSON.parse(localStorage.getItem('drpap_leads') || '[]');
    const rows = [['Nome', 'Hospital', 'WhatsApp', 'Maturidade', 'Data'], ...leads.map((l) => [l.nome, l.hospital, l.whatsapp, l.maturidade, l.data])];
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'leads-dr-pap.csv';
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <button type="button" className="ghost" onClick={exportCsv}>
      <Download size={18} /> Exportar leads
    </button>
  );
}

createRoot(document.getElementById('root')).render(<App />);
