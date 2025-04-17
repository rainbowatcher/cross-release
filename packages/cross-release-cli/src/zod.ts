import { z } from "zod"

export const cliOptions = z.object({
    commit: z.union([z.object({
        signoff: z.boolean(),
        stageAll: z.boolean(),
        template: z.string(),
        verify: z.boolean(),
    }), z.boolean()]).describe("Indicates whether to commit the changes."),
    config: z.string().optional(),
    cwd: z.string(),
    debug: z.boolean(),
    dry: z.boolean(),
    exclude: z.array(z.string()),
    execute: z.array(z.string()),
    main: z.string(),
    push: z.union([z.object({
        branch: z.string().optional(),
        followTags: z.boolean(),
        remote: z.string().optional(),
    }), z.boolean()]),
    recursive: z.boolean(),
    tag: z.union([z.object({
        template: z.string(),
    }), z.boolean()]),
    version: z.string().optional(),
    yes: z.boolean(),
})


export type CliOptions = z.infer<typeof cliOptions>
