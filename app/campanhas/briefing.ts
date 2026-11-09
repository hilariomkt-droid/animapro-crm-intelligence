export function briefing(campaign:string,segment:string) {
  return `Você é redator da AnimaPro Studio. Campanha: ${campaign}. Segmento: ${segment || 'comércio local'}. Sugira três temas de comerciais animados, uma abertura curta de WhatsApp e duas perguntas para continuar a conversa. Escreva em português do Brasil. Use {empresa} para personalizar. Não invente ofertas, resultados, datas ou preços.`;
}
