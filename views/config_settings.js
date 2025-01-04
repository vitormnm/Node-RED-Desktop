api.send('check_settings', '')

api.handle('check_settings', (event, data) => function (event, data) {



    document.getElementById("inp_projects").checked = data.editorTheme.projects.enabled

    document.getElementById("inp_httpAdminRoot").value = data.httpAdminRoot

    document.getElementById("inp_httpNodeRoot").value = data.httpNodeRoot

    document.getElementById("inp_uiPort").value = data.uiPort

    document.getElementById("inp_flowFile").value = data.flowFile
    
    document.getElementById("inp_StaticFolder").value = data.StaticFolder

    document.getElementById("inp_AdminTitle").value = data.editorTheme.page.title

    document.getElementById("inp_UrlHomeScreen").value = data.UrlHomeScreen

    document.getElementById("inp_UrlAdmin").value = data.UrlAdmin

    document.getElementById("inp_UrlDashboard").value = data.UrlDashboard

});
