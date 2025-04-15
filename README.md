# @accon/connect

**@accon/connect** é uma biblioteca que centraliza a integração entre a plataforma Accon e diversos serviços externos do ecossistema de food service. Seu objetivo é padronizar e simplificar a comunicação com plataformas de logística, PDVs, marketing, fidelização, entre outros.

## Visão Geral

Esta biblioteca oferece uma interface extensível que permite que o sistema interno da Accon conecte-se de forma desacoplada com sistemas terceiros, respeitando contratos bem definidos de entrada e saída.

As integrações são carregadas dinamicamente e registradas via decoradores, tornando fácil adicionar novos serviços sem modificar o núcleo do sistema.

## Exemplos de integrações

- Logística: Uber Direct, Loggi, serviços próprios de entrega
- PDVs: Saipos, Sischef, TOTVS Chef, Consumer, GrandChef
- Marketing: plataformas de cashback, remarketing, CRM, etc.

## Principais recursos

- Sistema de eventos para rastrear o ciclo de vida das integrações
- Decorador `@RegistryIntegration()` para registrar dinamicamente integrações
- Tipagem forte para contratos de integração (ordens, clientes, pagamentos)
- Injeção de dependências com NestJS via `ModuleRef`
- Carregamento dinâmico de integrações 

## Instalação

```bash
npm install @accon/connect
```

## Uso básico

```ts
@Module({
  imports: [AcconConnectModule],
})
export class AppModule {}

// Em qualquer serviço
constructor(private readonly connectService: ConnectService) {}

await this.connectService.onOrderCreated({ ifood: { token: 'abc' } }, { order: pedido });
```

## Criando uma nova integração

```ts
@RegistryIntegration({ id: 'loggi' })
export class LoggiOutputOrder implements OutputOrderIntegration {
  constructor(private readonly http: HttpService) {}

  async onOrderCreated(order: Order, config: any): Promise<void> {
    // lógica de envio do pedido para a Loggi
  }
}
```

## Licença

Business Source License 1.1 — para uso exclusivo dentro da plataforma Accon. 
