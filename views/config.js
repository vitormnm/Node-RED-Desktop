
//First check
api.send('check_password', '')



api.handle('check_password', (event, data) => function (event, data) {

    RenderCheckPassword(data)

});



function enable_password_writing() {
    inp_user = document.getElementById("inp_user").value
    inp_password = document.getElementById("inp_password").value
    inp_password_confirm = document.getElementById("inp_password_confirm").value



    if (inp_password == inp_password_confirm && inp_password != '' && inp_user != '') {
        api.send('enable_password_writing', {
            UserName: inp_user,
            PassWord: inp_password

        })
    }
}


function disabled_password_writing() {
    api.send('disabled_password_writing', '')
}


function RenderCheckPassword(data) {

    if (data.checked == true) {


        document.getElementById("Render_form_checkbox_password").innerHTML = `
        <div class="mb-4 form-check">
        <input type="checkbox" class="form-check-input"  onchange="checkbox_EnabledPassword_onchange(this)" checked="true" id="checkbox_EnabledPassword">
        <label class="form-check-label" for="exampleCheck1">Enabled password</label>
        </div>
        `

        document.getElementById("Render_form_password").innerHTML = `
       
        <div class="mb-4">
        <label for="exampleInputEmail1" class="form-label">User name</label>
        <input type="text" class="form-control" id="inp_user" value="${data.UserName}" >
        </div>
        <div class="mb-4">
        <label for="exampleInputEmail1" class="form-label">Password</label>
        <input type="password" class="form-control" id="inp_password">
        </div>
        <div class="mb-4">
        <label for="exampleInputPassword1" class="form-label">Confirm Password</label>
        <input type="password" class="form-control" id="inp_password_confirm">
        </div>
        <button onclick="enable_password_writing()" class="btn btn-primary mb-4">Save password</button>
         `
    } else {

        document.getElementById("Render_form_checkbox_password").innerHTML = `
        <div class="mb-4 form-check">
        <input type="checkbox" class="form-check-input"  onchange="checkbox_EnabledPassword_onchange(this)"  id="checkbox_EnabledPassword">
        <label class="form-check-label" for="exampleCheck1">Enabled password</label>
        </div>
        `
    }

}



function checkbox_EnabledPassword_onchange(checkbox) {


    if (checkbox.checked == true) {
        document.getElementById("Render_form_password").innerHTML = `
   
    <div class="mb-4">
    <label for="exampleInputEmail1" class="form-label">User name</label>
    <input type="text" class="form-control" id="inp_user" value="" >
    </div>
    <div class="mb-4">
    <label for="exampleInputEmail1" class="form-label">Password</label>
    <input type="password" class="form-control" id="inp_password">
    </div>
    <div class="mb-4">
    <label for="exampleInputPassword1" class="form-label">Confirm Password</label>
    <input type="password" class="form-control" id="inp_password_confirm">
    </div>
    <button onclick="enable_password_writing()" class="btn btn-primary mb-4">Save</button>
     `
    } else {

        document.getElementById("Render_form_password").innerHTML = `
        <div class="mb-4">
        <button onclick="disabled_password_writing()" class="btn btn-primary mb-4">Save disabled password</button>
        </div>
        `
    }

}