'use client';
import { useState, useEffect } from 'react';
import { Sparkles, Loader2, Zap, LayoutDashboard, History, Download, CheckCircle2, ImageIcon, Video } from 'lucide-react';

const AgentAvatar = ({ name }: { name: string }) => {
  const colors: Record<string, string> = {
    Analyst: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    Strategist: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    Writer: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    Visualizer: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  };
  const colorClass = colors[name] || 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  return <div className={'px-3 py-1 rounded-full border text-[10px] font-bold tracking-wider backdrop-blur-sm ' + colorClass}>{name}</div>;
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [history, setHistory] = useState<any[]>([]);
  
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [currentAgent, setCurrentAgent] = useState('Analyst');
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [uiMessage, setUiMessage] = useState('Введите бизнес-запрос. Нейросеть сгенерирует пост, фото и видео.');
  const [finalOutput, setFinalOutput] = useState<any>(null);
  
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  const downloadResult = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Бесплатный генератор картинок (Pollinations)
  const generateImage = async (prompt: string) => {
    if (!prompt) return;
    setIsImageLoading(true);
    setGeneratedImageUrl(null);
    const encodedPrompt = encodeURIComponent(prompt);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
    setTimeout(() => {
      setGeneratedImageUrl(url);
      setIsImageLoading(false);
    }, 1200);
  };

  // Бесплатный генератор видео (Luma Dream Machine через Pollinations - новейшая технология)
  const generateVideo = async (prompt: string) => {
    if (!prompt) return;
    setIsVideoLoading(true);
    setGeneratedVideoUrl(null);
    const shortPrompt = prompt.length > 80 ? prompt.substring(0, 80) : prompt;
    const encodedPrompt = encodeURIComponent(shortPrompt);
    const url = `https://video.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=576&duration=5&seed=${Math.floor(Math.random() * 1000000)}`;
    setTimeout(() => {
      setGeneratedVideoUrl(url);
      setIsVideoLoading(false);
    }, 2500);
  };

  const runPipeline = async (userText: string) => {
    setIsProcessing(true);
    setIsDone(false);
    setFinalOutput(null);
    setGeneratedImageUrl(null);
    setGeneratedVideoUrl(null);
    setUiMessage('Запуск мультиагентного конвейера...');
    setProgress(0);

    setCurrentAgent('Analyst');
    setUiMessage('Аналитик выявляет главную боль и желание аудитории...');
    setProgress(25);
    await new Promise(r => setTimeout(r, 500));

    setCurrentAgent('Strategist');
    setUiMessage('Стратег выстраивает структуру поста...');
    setProgress(50);
    await new Promise(r => setTimeout(r, 500));

    setCurrentAgent('Writer');
    setUiMessage('Писатель накидывает цепляющие заголовки...');
    setProgress(75);
    await new Promise(r => setTimeout(r, 500));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: userText }] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCurrentAgent('Visualizer');
      setUiMessage('Визуализатор генерирует промпты для фото и видео...');
      setProgress(100);
      await new Promise(r => setTimeout(r, 400));

      setIsDone(true);
      setFinalOutput(data.final_output);
      
      if (data.final_output?.visual_prompt) {
        generateImage(data.final_output.visual_prompt);
        generateVideo(data.final_output.visual_prompt);
      }
      
      if (data.final_output) {
        const newItem = {
          id: Date.now().toString(),
          prompt: userText,
          result: data.final_output.title + '\n\n' + data.final_output.body,
          date: new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString()
        };
        setHistory(prev => {
          const updated = [newItem, ...prev];
          localStorage.setItem('felix_ai_history', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err: any) {
      setUiMessage('Ошибка: ' + err.message);
      setProgress(0);
      setIsDone(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    const userText = input.trim();
    setInput('');
    await runPipeline(userText);
  };

  useEffect(() => {
    const saved = localStorage.getItem('felix_ai_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  return (
    <div className='flex h-screen bg-[#05060d] text-slate-100 font-sans overflow-hidden relative'>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-rose-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/5 blur-[100px] rounded-full pointer-events-none"></div>

      <aside className='w-72 bg-[#080a18]/80 backdrop-blur-xl border-r border-white/5 flex flex-col p-6 relative z-10'>
        <div className='flex items-center gap-3 mb-10'>
          <div className='w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.4)]'>
            <Sparkles className='w-5 h-5 text-white' />
          </div>
          <div>
            <h1 className='font-bold text-base tracking-wide'>Agentic OS</h1>
            <p className='text-[10px] text-rose-400 font-medium tracking-wider'>ПРОДУКТ МИРОВОГО УРОВНЯ</p>
          </div>
        </div>
        <nav className='space-y-2'>
          <button onClick={() => setActiveTab('dashboard')} className={'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ' + (activeTab === 'dashboard' ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-white/10' : 'text-slate-500 hover:text-white hover:bg-white/5')}>
            <LayoutDashboard className='w-4 h-4' /> Консоль управления
          </button>
          <button onClick={() => setActiveTab('history')} className={'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ' + (activeTab === 'history' ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-white/10' : 'text-slate-500 hover:text-white hover:bg-white/5')}>
            <History className='w-4 h-4' /> История ({history.length})
          </button>
        </nav>
        <div className='mt-auto pt-6 border-t border-white/5'>
          <div className='flex items-center justify-between text-[10px] text-slate-500'>
            <span>Состояние</span>
            <span className='flex items-center gap-1.5 text-emerald-400 font-medium'><span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse'></span> 100% Free</span>
          </div>
        </div>
      </aside>

      <main className='flex-1 flex flex-col overflow-hidden relative z-10'>
        <header className='h-20 bg-[#080a18]/40 backdrop-blur-md border-b border-white/5 px-8 flex items-center justify-between'>
          <h2 className='text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400'>Конвейер контента нового поколения</h2>
          <div className='w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-sm backdrop-blur-sm'>FX</div>
        </header>

        <div className='flex-1 overflow-y-auto p-8 bg-transparent'>
          {activeTab === 'dashboard' && (
            <div className='max-w-5xl mx-auto space-y-8'>
              <div className='bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 relative overflow-hidden'>
                
                <div className='flex justify-between items-center mb-8'>
                  <div className='flex items-center gap-2'>
                    <span className='text-xs font-medium text-slate-400 uppercase tracking-widest'>Команда агентов:</span>
                    <AgentAvatar name={currentAgent} />
                  </div>
                </div>

                {/* Светящийся прогресс-бар */}
                <div className='w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-6'>
                  <div 
                    className={`h-full transition-all duration-700 ease-out ${isDone ? 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]' : 'bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]'}`} 
                    style={{ width: progress + '%' }}
                  ></div>
                </div>

                <div className='p-6 bg-white/[0.03] border border-white/5 rounded-2xl min-h-[70px] flex items-center text-sm text-slate-300'>
                  {isProcessing && <Loader2 className='w-5 h-5 animate-spin mr-3 text-rose-400' />}
                  {isDone && <CheckCircle2 className='w-5 h-5 mr-3 text-emerald-400' />}
                  {uiMessage}
                </div>

                {/* Карточка результата со стеклянным эффектом */}
                {finalOutput && (
                  <div className='mt-8 p-6 bg-gradient-to-b from-white/[0.08] to-transparent border border-white/10 rounded-2xl overflow-hidden transition-all duration-500'>
                    <div className='space-y-4'>
                      <h3 className='text-2xl font-bold text-white tracking-tight leading-tight'>{finalOutput.title}</h3>
                      <div className='text-base text-slate-300 leading-relaxed bg-black/30 p-4 rounded-xl border border-white/5 whitespace-pre-wrap'>
                        {finalOutput.body}
                      </div>
                      
                      <div className='mt-4 pt-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {/* Блок Фото */}
                        <div className='bg-black/40 border border-white/10 rounded-xl p-3'>
                          <div className='flex items-center gap-2 mb-2 text-xs text-slate-400'>
                             <ImageIcon className='w-4 h-4' /> Фото-обложка
                          </div>
                          {isImageLoading ? (
                            <div className='h-32 flex items-center justify-center bg-slate-800/30 rounded-lg animate-pulse'>
                               <Loader2 className='w-5 h-5 animate-spin text-rose-400' />
                            </div>
                          ) : generatedImageUrl ? (
                            <a href={generatedImageUrl} target='_blank' rel='noreferrer' className='block rounded-lg overflow-hidden border border-white/5 group'>
                               <img src={generatedImageUrl} alt="AI Image" className='w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300' />
                            </a>
                          ) : <div className='h-20 flex items-center justify-center text-[10px] text-slate-600'>Ожидание...</div>}
                        </div>

                        {/* Блок Видео */}
                        <div className='bg-black/40 border border-white/10 rounded-xl p-3'>
                          <div className='flex items-center gap-2 mb-2 text-xs text-slate-400'>
                             <Video className='w-4 h-4' /> AI Видео-ролик (5 сек)
                          </div>
                          {isVideoLoading ? (
                            <div className='h-32 flex items-center justify-center bg-slate-800/30 rounded-lg animate-pulse'>
                               <Loader2 className='w-5 h-5 animate-spin text-purple-400' />
                            </div>
                          ) : generatedVideoUrl ? (
                             <video src={generatedVideoUrl} autoPlay loop muted playsInline className='w-full h-auto rounded-lg border border-white/5 shadow-lg'></video>
                          ) : <div className='h-20 flex items-center justify-center text-[10px] text-slate-600'>Ожидание...</div>}
                        </div>
                      </div>

                      <div className='flex flex-wrap justify-between items-center pt-2 border-t border-white/5 mt-2'>
                         <div className='flex flex-wrap gap-2'>
                            <span className='text-xs font-medium text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20'>CTA: {finalOutput.call_to_action}</span>
                         </div>
                         <button 
                           onClick={() => downloadResult(`Заголовок: ${finalOutput.title}\n\nТекст поста:\n${finalOutput.body}\n\nCTA: ${finalOutput.call_to_action}\nПромпт: ${finalOutput.visual_prompt}`, 'post.txt')}
                           className='flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 text-slate-300 px-3 py-1.5 rounded-lg transition cursor-pointer border border-white/5'
                         >
                           <Download className='w-3.5 h-3.5' /> Скачать пакет
                         </button>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSend} className='flex gap-3 mt-6 border-t border-white/5 pt-6'>
                  <input value={input} onChange={(e) => setInput(e.target.value)} placeholder='Введи бизнес, ЦА, нишу...' disabled={isProcessing} className='flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500 focus:bg-black/40 transition-all placeholder-slate-500' />
                  <button type='submit' disabled={isProcessing} className='px-6 bg-gradient-to-r from-rose-600 to-purple-600 hover:opacity-90 text-white font-bold rounded-xl transition flex items-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(244,63,94,0.2)]'>
                    {isProcessing ? <Loader2 className='w-4 h-4 animate-spin' /> : <Zap className='w-4 h-4' />}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className='max-w-4xl mx-auto space-y-4'>
              <div className='bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6'>
                <h3 className='text-lg font-semibold'>История генераций</h3>
              </div>
              {history.map((item) => (
                <div key={item.id} className='bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition'>
                  <div className='text-[10px] text-slate-400 mb-2'>{item.date}</div>
                  <div className='text-sm text-slate-200 font-medium mb-2'>{item.prompt}</div>
                  <div className='bg-black/30 border border-white/5 rounded-xl p-4 text-xs text-slate-300 whitespace-pre-wrap max-h-32 overflow-y-auto'>
                    {item.result}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
