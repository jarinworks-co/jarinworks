# jarinworks.com — setup guide

One-time setup, about 30 minutes. After it's done, you edit the site at jarinworks.com/admin.

## 1. Put the files on GitHub
1. Unzip `jarinworks.zip`.
2. Open `admin/config.yml` in Notepad. Change `GITHUB_USERNAME` to your GitHub username, then save.
3. On github.com, click **New repository**:
   - Name it `jarinworks`.
   - Set it to **Public** or **Private**; both work.
   - Click Create.
4. On the new repository page, click **uploading an existing file**. Drag in everything **inside** the unzipped folder, not the folder itself, then click **Commit changes**.

## 2. Deploy on Netlify
1. In Netlify, go to **Projects**, click **Import a Git repository**, then **GitHub**, and choose `jarinworks`.
2. Netlify reads the settings from `netlify.toml`, so don't change any build settings. Click **Deploy**.
3. After about a minute, the site is live at a temporary address like `something.netlify.app`.

## 3. Connect jarinworks.com
1. In Netlify, open the project, go to **Domain management**, click **Add a domain**, and enter `jarinworks.com`.
2. Netlify shows the DNS records to add. Usually that's:
   - an **A** record for `@` pointing to Netlify's load balancer IP
   - a **CNAME** record for `www` pointing to your `xxx.netlify.app` address
3. In Spaceship, open the domain, go to **DNS**, and add exactly the records Netlify shows. Delete any old A or CNAME records for `@` or `www` that are already there.
4. Wait between 10 minutes and a few hours. Netlify then turns on HTTPS automatically.

## 4. Turn on the editor login (GitHub)
1. On GitHub, go to **Settings → Developer settings → OAuth Apps → New OAuth App** and fill it in:
   - Application name: `Jarin Works CMS`
   - Homepage URL: `https://jarinworks.com`
   - Authorization callback URL: `https://api.netlify.com/auth/done`
2. Click Register. Copy the **Client ID**, then click **Generate a new client secret** and copy the secret too.
3. In Netlify, open the project, go to **Project configuration → Access & security → OAuth**, click **Install provider**, choose **GitHub**, and paste the Client ID and the secret.
4. Go to `https://jarinworks.com/admin` and click **Login with GitHub**.

## 5. Edit content
- Every section is under **Website content**.
- Edit a section, then click **Publish**. The live site updates in about a minute.
- **Videos:** paste a YouTube, Facebook, Google Drive or Vimeo link. YouTube thumbnails fill in automatically.
- **Images:** upload them as JPG, ideally under 500 KB each. Use a compression site such as squoosh.app first.
- **Hiding a section:** delete all its items. The award section has its own on/off switch.

## Backup
Everything lives in the GitHub repository. To download a full copy: **Code → Download ZIP**.

## If something breaks
- **Site not updating:** check Netlify → **Deploys** for errors.
- **Can't log in at /admin:** check that `admin/config.yml` has the right `username/jarinworks`, and that the OAuth callback URL is exactly `https://api.netlify.com/auth/done`.
