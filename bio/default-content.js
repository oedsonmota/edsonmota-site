/* Conteúdo padrão do link na bio. Aparece se o banco não responder e é o ponto de partida do painel.
   Texto entre *asteriscos* fica fino (como o IN de INQUIETOS). Datas sem fuso = horário de Brasília. */
window.BIO_DEFAULT = {
  top: { logo: '*IN*QUIETOS', showSwitch: true, labelQuiet: 'Quieto', labelLoud: '*In*quieto', defaultMode: 'auto' },
  profile: {
    name: 'Edson Mota',
    role: 'Estrategista de marca e posicionamento\npara profissionais criativos',
    photo: '', showPhoto: false
  },
  features: [
    {
      id: 'guia-inquietos', active: true, start: '', end: '',
      tag: 'Guia gratuito', small: 'Guia para', title: '*IN*QUIETOS',
      text: 'Como transformar anos de bom trabalho em reconhecimento no mercado.',
      button: 'Baixar o guia grátis', href: 'https://guiainquietos.edsonmota.com', image: ''
    }
  ],
  links: [
    { id: 'comunidade', active: true, title: 'Comunidade dos *IN*QUIETOS', sub: 'Aulas ao vivo comigo, toda semana', href: 'https://edsonmotajunior.typeform.com/to/zVsElhqk', badge: 'Lista de espera', accent: false, start: '', end: '' },
    { id: 'construa-sua-marca', active: true, title: 'Construa sua marca comigo', sub: 'Aplicação para acompanhamento', href: 'https://edsonmotajunior.typeform.com/to/UylmUkGl', badge: '', accent: true, start: '', end: '' },
    { id: 'site', active: true, title: 'Meu site', sub: 'edsonmota.com', href: 'https://edsonmota.com', badge: '', accent: false, start: '', end: '' },
    { id: 'linkedin', active: true, title: 'LinkedIn', sub: 'Trajetória, cases e conversas', href: 'https://www.linkedin.com/in/oedsonmota/', badge: '', accent: false, start: '', end: '' },
    { id: 'behance', active: true, title: 'Behance', sub: 'Projetos de identidade e direção de arte', href: 'https://www.behance.net/edsonmota', badge: '', accent: false, start: '', end: '' }
  ],
  footer: '© 2027 · *IN*QUIETOS',
  background: { dots: true },
  seo: {
    title: 'Edson Mota · Links',
    description: 'Edson Mota, estrategista de marca e posicionamento para profissionais criativos.'
  }
};
