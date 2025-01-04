
function save_settings() {


   let payload = {
      inp_UrlHomeScreen: document.getElementById("inp_UrlHomeScreen").value,
      inp_UrlAdmin: document.getElementById("inp_UrlAdmin").value,
      inp_UrlDashboard: document.getElementById("inp_UrlDashboard").value,
      inp_uiPort: document.getElementById("inp_uiPort").value,
      inp_AdminTitle: document.getElementById("inp_AdminTitle").value,
      inp_flowFile: document.getElementById("inp_flowFile").value,
      inp_StaticFolder: document.getElementById("inp_StaticFolder").value,
      inp_projects: document.getElementById("inp_projects").checked,
      inp_httpAdminRoot: document.getElementById("inp_httpAdminRoot").value,
      inp_httpNodeRoot: document.getElementById("inp_httpNodeRoot").value
   }

   api.send('save_settings', payload)
}