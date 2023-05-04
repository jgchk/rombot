import { ping } from './ping'

export const commands = [ping]
export const commandMap = new Map(commands.map((command) => [command.data.name, command]))
