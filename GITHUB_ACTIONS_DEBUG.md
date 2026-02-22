# 🔍 GitHub Actions Workflow Debugging Guide

## ❌ Problem: Workflow Not Running Automatically

If your `keep-alive.yml` workflow is not running, check these:

---

## ✅ **Checklist: Why Workflow Might Not Run**

### 1. **GitHub Actions Enabled?**
- Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/actions`
- Check: **"Allow all actions and reusable workflows"** is selected
- If disabled, enable it and save

### 2. **Workflow File Location**
- ✅ Must be in: `.github/workflows/keep-alive.yml`
- ✅ File must be committed to Git
- ✅ File must be on `main` branch (or default branch)

### 3. **First Run Requirement**
- ⚠️ **GitHub Actions cron jobs need a push first!**
- First run must be triggered manually OR by a push
- After first run, cron will work automatically

### 4. **Cron Schedule Limitations**
- GitHub Actions **minimum cron interval is 5 minutes**
- Even if you set `* * * * *` (every minute), GitHub will round to 5 minutes
- Cron jobs can be **delayed by up to 15 minutes** by GitHub
- This is normal and expected behavior

### 5. **Branch Protection**
- If `main` branch is protected, workflows still run
- But check: Settings → Branches → Branch protection rules

### 6. **Repository Visibility**
- ✅ Public repos: Workflows run automatically
- ✅ Private repos: Need GitHub Actions enabled (free tier: 2000 min/month)

---

## 🚀 **How to Force Workflow to Run**

### **Method 1: Manual Trigger (IMMEDIATE)**
1. Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO/actions`
2. Click: **"Keep Render App Alive"** workflow
3. Click: **"Run workflow"** button (top right)
4. Select branch: `main`
5. Click: **"Run workflow"**
6. ✅ Workflow runs immediately!

### **Method 2: Push to Trigger**
```bash
# Make any change and push
git commit --allow-empty -m "Trigger keep-alive workflow"
git push origin main
```
✅ This triggers the workflow immediately (push trigger)

### **Method 3: Check Recent Runs**
1. Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO/actions`
2. Look for **"Keep Render App Alive"** in the list
3. Click to see run history
4. Check if it's running but failing silently

---

## 🔍 **Verify Workflow is Running**

### **Check 1: Actions Tab**
```
https://github.com/YOUR_USERNAME/YOUR_REPO/actions
```
- Should see "Keep Render App Alive" in the list
- Should see recent runs (green checkmark = success)

### **Check 2: Workflow Runs**
Click on "Keep Render App Alive" → See all runs:
- ✅ Green checkmark = Success
- ⚠️ Yellow circle = In progress
- ❌ Red X = Failed
- ⚪ Gray circle = Cancelled

### **Check 3: Run Details**
Click on a run → See logs:
- Should see: "✅ SUCCESS! App is awake (HTTP 200)"
- Should see: Render URL being pinged
- Should see: Timestamp of when it ran

---

## 🐛 **Common Issues & Fixes**

### **Issue 1: "Workflow not found"**
**Fix:**
- Ensure file is at: `.github/workflows/keep-alive.yml`
- Ensure file is committed: `git add .github/workflows/keep-alive.yml && git commit -m "Add workflow" && git push`

### **Issue 2: "Actions disabled"**
**Fix:**
- Go to: Repo → Settings → Actions
- Enable: "Allow all actions and reusable workflows"
- Save

### **Issue 3: "Cron not running"**
**Fix:**
- **First run must be triggered manually or by push**
- After first run, cron will work
- Cron can be delayed up to 15 minutes (GitHub limitation)

### **Issue 4: "Workflow runs but fails"**
**Fix:**
- Check logs for error messages
- Verify Render URL is correct: `https://gurbachanelectronics.onrender.com`
- Check if Render app is actually running

### **Issue 5: "Not running frequently enough"**
**Fix:**
- GitHub Actions minimum is 5 minutes
- We set it to every minute, but GitHub enforces 5-min minimum
- This is a GitHub limitation, not a bug

---

## 📊 **Expected Behavior**

### **After Setup:**
1. ✅ Workflow runs every **5 minutes** (GitHub minimum)
2. ✅ Workflow also runs on **every push to main**
3. ✅ Workflow can be **manually triggered**
4. ✅ Each run pings Render app
5. ✅ Render app stays awake 24/7

### **Timeline:**
- **First run**: Triggered by push or manual trigger
- **Subsequent runs**: Every 5 minutes (cron)
- **Also runs**: On every push to main branch

---

## 🎯 **Quick Test**

Run this to trigger workflow immediately:
```bash
git commit --allow-empty -m "Test: Trigger keep-alive workflow"
git push origin main
```

Then check:
```
https://github.com/YOUR_USERNAME/YOUR_REPO/actions
```

---

## 📝 **Current Configuration**

- **Cron**: `* * * * *` (every minute, GitHub rounds to 5 min)
- **Push trigger**: Any push to `main` branch
- **Manual trigger**: Enabled (`workflow_dispatch`)
- **Render URL**: `https://gurbachanelectronics.onrender.com`
- **Timeout**: 2 minutes per run

---

## ✅ **Verification Steps**

1. ✅ Workflow file exists: `.github/workflows/keep-alive.yml`
2. ✅ File is committed to Git
3. ✅ GitHub Actions is enabled
4. ✅ Trigger workflow manually (first time)
5. ✅ Check Actions tab for runs
6. ✅ Verify logs show "✅ SUCCESS!"

---

## 🆘 **Still Not Working?**

1. **Check GitHub Status**: https://www.githubstatus.com/
2. **Check Repository Settings**: Actions → General → Workflow permissions
3. **Contact GitHub Support**: If Actions is enabled but not running
4. **Alternative**: Use external cron service (UptimeRobot, cron-job.org)

---

## 💡 **Pro Tip**

The workflow now triggers on **every push to main**, so even if cron is delayed, any code change will ping Render and keep it awake!
