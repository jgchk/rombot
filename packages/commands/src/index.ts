import { chart } from './chart'
import { ping } from './ping'
import { setUsername } from './set-username'
import type { Command } from './types'

export { ChartEntry, Chart, fetchChart } from './chart'

export const commands = [ping, setUsername, chart]
export const commandMap = new Map(commands.map((command) => [command.data.name, command]))

export const oldCommands: Command[] = []
