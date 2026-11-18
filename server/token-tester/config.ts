// Accept the previous names while existing deployments transition.
export function testerSetting(name: string) {
    return process.env[`TOKEN_TESTER_${name}`] ?? process.env[`PUSH_TESTER_${name}`];
}
