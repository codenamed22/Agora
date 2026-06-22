# Oracle Cloud Piston Judge

This guide deploys a self-hosted Piston API for ShardUp practice submissions.

## Do We Need Cloud-Init?

No, but use it if possible. Cloud-init makes the VM reproducible: Docker, Piston, Caddy HTTPS, bearer-token auth, and the Python/C++ runtimes are installed the same way every time.

Use `infra/oracle-piston-cloud-init.yaml` as the template. Replace placeholders before pasting it into Oracle Cloud.

## Recommended Free VM

Use Oracle Cloud Always Free.

- Shape: `VM.Standard.E2.1.Micro` (AMD/x86) for easiest Piston compatibility.
- OS: Ubuntu 22.04 or 24.04.
- Boot volume: 50 GB.
- Public IPv4: yes.

Oracle Ampere A1 has better free CPU/RAM, but it is ARM. Use it only after confirming the Piston image and runtime packages you need work on arm64.

## Step-By-Step

1. Generate a judge API key locally:

```bash
openssl rand -base64 32
```

2. Pick a subdomain, for example `judge.yourdomain.com`.

3. In Oracle Cloud, create an Always Free Ubuntu instance:

- Image: Ubuntu 22.04 or 24.04.
- Shape: `VM.Standard.E2.1.Micro`.
- Networking: assign public IPv4.
- SSH key: add your public SSH key.

4. Before creating the instance, open **Show advanced options → Management → Initialization script**.

5. Paste `infra/oracle-piston-cloud-init.yaml` after replacing:

- `__JUDGE_DOMAIN__` with your judge domain.
- `__JUDGE_API_KEY__` with the API key from step 1.
- `__LETSENCRYPT_EMAIL__` with your email.

6. Create the instance.

7. Add Oracle ingress rules for the VM subnet/security list:

- TCP `22` from your IP (SSH).
- TCP `80` from `0.0.0.0/0` (Let's Encrypt HTTP challenge).
- TCP `443` from `0.0.0.0/0` (ShardUp/Vercel calls the judge over HTTPS).

8. Point DNS at the VM public IP:

```text
judge.yourdomain.com A <ORACLE_VM_PUBLIC_IP>
```

9. SSH into the VM and watch bootstrap logs:

```bash
ssh ubuntu@<ORACLE_VM_PUBLIC_IP>
sudo tail -f /var/log/cloud-init-output.log
```

10. Check services:

```bash
sudo docker ps
systemctl status caddy --no-pager
curl -s http://127.0.0.1:2000/api/v2/runtimes
```

11. Test the public HTTPS endpoint with bearer auth:

```bash
curl -s https://judge.yourdomain.com/api/v2/runtimes \
  -H "Authorization: Bearer <JUDGE_API_KEY>"
```

12. Test execution:

```bash
curl -s https://judge.yourdomain.com/api/v2/execute \
  -H "Authorization: Bearer <JUDGE_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"language":"python","version":"3.10.0","files":[{"content":"print(sum(map(int, input().split())))"}],"stdin":"2 3\n"}'
```

Expected output includes `"stdout":"5\n"`.

13. Set Vercel environment variables:

```text
JUDGE_BASE_URL=https://judge.yourdomain.com/api/v2
JUDGE_API_KEY=<JUDGE_API_KEY>
PISTON_PYTHON_VERSION=3.10.0
PISTON_CPP_VERSION=10.2.0
```

Do not set `JUDGE_PROVIDER=fake` in production.

14. Redeploy Vercel and check:

```text
https://your-shardup-domain.com/api/health
```

## Operational Notes

- Keep Piston behind Caddy. Do not expose port `2000` publicly in Oracle ingress rules.
- Rotate `JUDGE_API_KEY` if it leaks. Update both Caddy and Vercel.
- Piston runs privileged because upstream Piston uses Isolate/cgroups inside Docker.
- If package installation fails, SSH into the VM and run the `ppman install` commands manually from `/opt/piston-src/cli`.

## Useful Commands On The VM

```bash
cd /opt/shardup-judge
sudo docker compose ps
sudo docker compose logs -f api
sudo docker compose pull
sudo docker compose up -d

sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy

node /opt/piston-src/cli/index.js -u http://127.0.0.1:2000 ppman list
node /opt/piston-src/cli/index.js -u http://127.0.0.1:2000 ppman install python=3.10.0
node /opt/piston-src/cli/index.js -u http://127.0.0.1:2000 ppman install gcc=10.2.0
```
