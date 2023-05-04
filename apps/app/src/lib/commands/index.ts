import { ping } from './ping'
import { setUsername } from './set-username'
import type { Command } from './types'

export const commands = [ping, setUsername]
export const commandMap = new Map(commands.map((command) => [command.data.name, command]))

export const oldCommands: Command[] = []
