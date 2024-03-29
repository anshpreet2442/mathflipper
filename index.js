 const $loginPopup           = $('.loginPopupClass');
    const $signupPopup          = $('.signupPopupClass');
    let selectedClassId         = 0;
    let selectedStreamId        = 0;
    let selectedBoardId         = 0;
    let selectedStateId         = 0;
    let selectedCityId          = 0;
    let isMobileVerifyOrLogin   = 0;
    let local_class_exams, local_boards, local_states, local_cities;
    let localClassExams, localBoards, localStates, localCities;
    let userProfileClass,userProfileStream,userProfileBoard,userProfileState,userProfileCity;
    var currMobileNumber;
    var dailyClickKeyConfig = { 'pdfclicks': 'askLoginForPDF', 'testclicks': 'askLoginForTest' };

    function convertUnicodeToString(name) {
        const unicodeToAsciiMapping = {
            'á': 'a', 'à': 'a', 'â': 'a', 'ä': 'a', 'ã': 'a', 'å': 'a', 'ā': 'a', 'æ': 'ae', 'ç': 'c', 'ć': 'c', 'č': 'c', 'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e', 'ē': 'e', 'ė': 'e', 'ę': 'e', 'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i', 'ī': 'i', 'į': 'i', 'ı': 'i', 'ĳ': 'ij', 'ð': 'd', 'ł': 'l', 'ñ': 'n', 'ń': 'n', 'ó': 'o', 'ò': 'o', 'ô': 'o', 'ö': 'o', 'õ': 'o', 'ø': 'o', 'ō': 'o', 'œ': 'oe', 'ř': 'r', 'ś': 's', 'š': 's', 'ß': 'ss', 'ť': 't', 'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u', 'ū': 'u'
        };

        let asciiString = name.split('').map(function(char) {
            return unicodeToAsciiMapping[char.toLowerCase()] || (char.charCodeAt(0) < 128 ? char : '');
        }).join('');

        return asciiString;
    }

    $(document).on('click', '.showSignupPopup', function() {
        var clickedElementId = $(this).attr('id');
        if(clickedElementId == 'complete-profile-bottom-link') {
            loginSource = 'bottomcompleteprofilebtn';
        }

        $signupPopup.removeClass('hideThis');
        $loginPopup.addClass('hideThis');
        $('#modalLogin').modal('show');
    });

    $(document).on('click', '.showLoginPopup', function() {
        hideEmptyForm();
        $signupPopup.addClass('hideThis');
        $loginPopup.removeClass('hideThis');
        $('#modalLogin').modal('show');
    });

    function setAndGetProfileComplitionPercentage() {
        var totalPerc = 0;
        if(checkIfValueIsCorrect(getDataFromLocalStorage('selfstudyUserDisplayName'))) { totalPerc = totalPerc + 20; }
        if(checkIfValueIsCorrect(getDataFromLocalStorage('selfstudyUserClassId'))) { totalPerc = totalPerc + 20; }
        if(checkIfValueIsCorrect(getDataFromLocalStorage('selfstudyUserStateId'))) { totalPerc = totalPerc + 20; }
        if(checkIfValueIsCorrect(getDataFromLocalStorage('selfstudyUserBoardId'))) { totalPerc = totalPerc + 20; }
        if(checkIfValueIsCorrect(getDataFromLocalStorage('selfstudyUserPhoneVerified'))) { totalPerc = totalPerc + 20; }

        $('#complete-profile-bottom-span').html('Profile Completed: ' + totalPerc + '%');
        return totalPerc;
    }
    
    function createSelectBoxItem(itemName, itemValue, itemClass) {
        return "<a class='dropdown-item " + itemClass + "' href='javascript:void(0);' data-value='" + itemValue + "'>" + itemName + "</a>";
    }

    function saveUserProfileData(step) {
        const uuid = getUserUUID();
        const username = $('#udUsername').val();
        const phonenumber = $('#udPhonenumber').val();

        if(step == 2 && username.length == 0) {
            $('.error-msg').html('Please Enter your name.').removeClass('hideThis alert-success').addClass('alert-danger');
            return;
        }

        if(step == 2 && (phonenumber.length !== 10 || isNaN(phonenumber))) {
            $('.error-msg').html('Please enter a 10-digit phone number.').removeClass('hideThis alert-success').addClass('alert-danger');
            return;
        }

        if(step == 2 && selectedClassId == 0) {
            $('.error-msg').html('Please Select Class.').removeClass('hideThis alert-success').addClass('alert-danger');
            return;
        }

        if(step == 2 && !$('#userdataTandC1').is(':checked')) {
            $('.error-msg').html('Please accept the Terms of Use & Privacy Policy.').removeClass('hideThis alert-success').addClass('alert-danger');
            return;
        }

        if(checkIfValueIsCorrect(getUserUUID())) {
            updateUserProfileToServer(getUserUUID(), username, phonenumber, selectedClassId, selectedStreamId, selectedBoardId, selectedStateId, selectedCityId, '', '')
                .then(function(data) {
                    console.log('Update successful:', data);
                    if (data.status == "success") { }
                    if(step == 2) {
                        $('#modalUserDetails').modal('hide');
                        showEmptyForm("Alert", data.data.message, 0, 0, "OK", "", 0);
                    }
                })
                .catch(function(error) {
                    $('#modalUserDetails').modal('hide');
                    // console.log('Error: ', error);
                    showEmptyForm("Error", "Error in saving Profile Information...", 0, 0, "OK", "", 0);
                });
        }
    }

    $(document).on('click', '#saveUserProfileBtn', function(e) {
        e.preventDefault();
        $('.error-msg').addClass('hideThis');

        saveUserProfileData(2);
    });

    function activateSendOtpBtn() {
        if($('#loginMobileNumber').val().length > 9) {
            $('.generateOTPBtn').removeClass('btn-secondary').addClass('btn-primary');
        }
    }

    $(document).on('click', '#changeCurrMobileNumber', function(e) {
        $('#modalValidatingOTP').modal('hide');
        $('#modalLoginMobile').modal('show');
        activateSendOtpBtn();
    });

    $(document).on('click', '.verifyMobileNumberBtn', function(e) {
        isMobileVerifyOrLogin = 1;
        $('.vmnClass').removeClass('hideThis');
        $('.signupPopupClass, .loginPopupClass').addClass('hideThis');
        $('#modalLoginMobile').modal('show');
        activateSendOtpBtn();
    });

    $(document).on('click', '.loginSignupUsingMobile', function(e) {
        isMobileVerifyOrLogin = 2;
        $('.vmnClass, .loginPopupClass').addClass('hideThis');
        $('.signupPopupClass').removeClass('hideThis');
        $('#modalLoginMobile').modal('show');
        activateSendOtpBtn();
    });

    $(document).on('click', '.generateOTPBtn', function(e) {
        generateOTP(e, 1);
    });

    $(document).on('click', '.reGenerateOTPBtn', function(e) {
        generateOTP(e, 2);
    });

    function generateOTP(e, source) {
        if(checkIfValueIsCorrect(getUserUUID())) {
            if(checkIfValueIsCorrect(e)) { e.preventDefault(); }
            $('.error-msg').addClass('hideThis');
            
            if ($('#loginMobileNumber').length && checkIfValueIsCorrect($('#loginMobileNumber').val())) {
                currMobileNumber = $('#loginMobileNumber').val();
            } else if(checkIfValueIsCorrect(getDataFromLocalStorage('selfstudyUserPhone'))) {
                currMobileNumber = getDataFromLocalStorage('selfstudyUserPhone');
            }

            if(checkIfValueIsCorrect(currMobileNumber)) {
                var otpData = '{"mobile_number":"' + currMobileNumber + '","app_hash":"selfstudys.com"}';
                const payload = {'application_id': 'com.selfstudys', 'uuid': getUserUUID(), 'otp_data': otpData };

                $.ajax({
                    method: 'POST',
                    url: "https://topcoaching.in/api/generate-otp-for-login-v2",
                    dataType: 'json',
                    data: payload
                })
                .done(function(data) {
                    console.log('responsedata: ', data);
                    if (data.status == "success") {
                        if (data.data.status == 1) {
                            if(source == 1) {
                                $('#modalLoginMobile').modal('hide');
                                $('.currMobileNumber').html(currMobileNumber);
                                $('#modalValidatingOTP').modal('show');
                            } else if(source == 2) {
                                $('.error-msg').html("The code has been resent.").removeClass('alert-danger hideThis').addClass('alert-success');
                            }
                        } else {
                            $('.error-msg').html(data.data.message).removeClass('hideThis alert-success').addClass('alert-danger');
                        }
                    } else {
                        $('.error-msg').html(data.data.message).removeClass('hideThis alert-success').addClass('alert-danger');
                    }
                })
                .fail(function( jqXHR, textStatus, error ) {
                    console.log('Error: ', error);
                    $('.error-msg').html('Error in generating OTP...').removeClass('hideThis alert-success').addClass('alert-danger');
                });
            } else {
                $('.error-msg').html('Please enter mobile number.').removeClass('hideThis alert-success').addClass('alert-danger');
            }
        }
    }

    $('#loginVerifyOTP').on('click', function() {
        var otpNumber1 = $('#totp1').val();
        var otpNumber2 = $('#totp2').val();
        var otpNumber3 = $('#totp3').val();
        var otpNumber4 = $('#totp4').val();

        if (!otpNumber1 || !otpNumber2 || !otpNumber3 || !otpNumber4) {
            alert('Please Enter OTP');
            return;
        }
        
        const payload = {'application_id': 'com.selfstudys', 'device_type': 2, 'app_version': 1, 'phone_verified': currMobileNumber, 'user_submitted_otp': + otpNumber1 + otpNumber2 + otpNumber3 + otpNumber4 };

        var postUrl;
        if(isMobileVerifyOrLogin == 1 || isMobileVerifyOrLogin == 3) {
            const uuid = getUserUUID();
            payload.uuid = uuid;
            postUrl  = "https://topcoaching.in/api/update-phone-verified";
        } else if(isMobileVerifyOrLogin == 2) {
            postUrl  = "https://topcoaching.in/api/validate-otp-for-login-v2";
        }

        if(checkIfValueIsCorrect(postUrl)) {
            $.ajax({
                method: 'POST',
                url: postUrl,
                dataType: 'json',
                data: payload
            })
            .done(function(data) {
                console.log('responsedata: ', data);
                console.log('isMobileVerifyOrLogin: ', isMobileVerifyOrLogin);
                if (data.status == "success") {
                    // $('#modalValidatingOTP').modal('hide');
                    // showEmptyForm("Alert", data.data.message, 0, 0, "OK", "", 0);

                    if(isMobileVerifyOrLogin == 1 || isMobileVerifyOrLogin == 3) {
                        if (data.data.status > 0) {
                            $('#modalValidatingOTP').modal('hide');
                            showEmptyForm("Alert", data.data.message, 0, 0, "OK", "", 0);
                            saveDataToLocalStorage('selfstudyUserPhoneVerified', currMobileNumber);
                            $('.verifyMobileNumberBtn').addClass('hideThis');
                            
                            if(isMobileVerifyOrLogin == 1) {
                                console.log('going to profile.');
                                window.location.href = "https://www.selfstudys.com/user/profile";
                            }
                        } else {
                            $('.error-msg').html(data.data.message).removeClass('hideThis alert-success').addClass('alert-danger');
                        }
                    } else if(isMobileVerifyOrLogin == 2) {
                        if(data.data.status > 0) {
                            $('#modalValidatingOTP').modal('hide');
                            showEmptyForm("Alert", data.data.message, 0, 0, "OK", "", 0);

                            saveDataToLocalStorage('selfstudyUUID', data.data.user.uuid);
                            if(data.data.user.photo_url) { saveDataToLocalStorage('selfstudyUserPhotoUrl', data.data.user.photo_url); }
                            if(data.data.user.name) { saveDataToLocalStorage('selfstudyUserDisplayName', data.data.user.name); } else { saveDataToLocalStorage('selfstudyUserDisplayName', "User"); }
                            if(data.data.user.email) { saveDataToLocalStorage('selfstudyUserEmailId', data.data.user.email); }
                            registerToken();
                            
                            if (data.data.status == 1) { //Register
                                userSubscribeForNotification();
                                hideEmptyForm();
                                    
                                if(getDataFromLocalStorage('isLoginForDownloadPDF') != 'yes') {
                                    $('#modalUserDetails').modal('show');
                                }
                            } else { //Login
                                // hideEmptyForm(); // Auto Hide popup
                                $('#popupBody').html(data.data.message);
                            }

                            if(getDataFromLocalStorage('isLoginForDownloadPDF') == 'yes') {
                                removeItemFromLocalStorage('isLoginForDownloadPDF');
                                sendEmailToDownloadPDF();
                            }
                            updateHeaderProfileView();
                        } else {
                            $('.error-msg').html(data.data.message).removeClass('hideThis alert-success').addClass('alert-danger');
                        }
                    }
                } else {
                    console.log('Not get Success.');
                }
            })
            .fail(function( jqXHR, textStatus, error ) {
                console.log('Error: ', error);
                $('.error-msg').html('Error in generating OTP...').removeClass('hideThis alert-success').addClass('alert-danger');
            });
        }
    });

    $('#modalUserDetails').on('shown.bs.modal', function() {
        $(this).find('.mttoc').click(function() {
            $(this).closest('.modal-body').animate({
                scrollTop: $(this).offset().top - 50
            }, 500); 
            
            return false;
      });
    });

    //Check where is this function used, if not used now then delete it
    function updateUserProfile(userName, phoneNumber, classId, boardId, stateId, cityId, gender, dateOfBirth) {
        const uuid = getUserUUID();
        
        if(checkIfValueIsCorrect(uuid)) {
            if(checkIfValueIsCorrect(userName) || checkIfValueIsCorrect(phoneNumber) || checkIfValueIsCorrect(classId) || checkIfValueIsCorrect(boardId) || checkIfValueIsCorrect(stateId) || checkIfValueIsCorrect(cityId) || checkIfValueIsCorrect(gender) || checkIfValueIsCorrect(dateOfBirth) ) {

                let payload = { 'application_id': 'com.selfstudys', 'uuid': uuid, 'app_version': 1 };

                if(checkIfValueIsCorrect(userName)) {
                    payload.name = userName;
                }
                if(checkIfValueIsCorrect(phoneNumber)) {
                    payload.phone = phoneNumber;
                }
                if(checkIfValueIsCorrect(classId)) {
                    payload.class_id = classId;
                }
                if(checkIfValueIsCorrect(boardId)) {
                    payload.board_id = boardId;
                }
                if(checkIfValueIsCorrect(stateId)) {
                    payload.state_id = stateId;
                }
                if(checkIfValueIsCorrect(cityId)) {
                    payload.city_id = cityId;
                }
                if(checkIfValueIsCorrect(gender)) {
                    payload.gender = gender;
                }
                if(checkIfValueIsCorrect(dateOfBirth)) {
                    payload.dob = dateOfBirth;
                }

                $.ajax({
                    method: 'POST',
                    url: "https://topcoaching.in/api/update-user-profile-v2",
                    dataType: 'json',
                    data: payload
                })
                .done(function(data) {
                    if (data.status == "success") {
                        saveDataToLocalStorage('selfstudyUserDisplayName', data.data.user.name);
                        saveDataToLocalStorage('selfstudyUserPhone', data.data.user.phone);
                        saveDataToLocalStorage('selfstudyUserPhoneVerified', data.data.user.phone_verified);
                        saveDataToLocalStorage('selfstudyUserClassId', data.data.user.class_id);
                        saveDataToLocalStorage('selfstudyUserBoardId', data.data.user.board_id);
                        saveDataToLocalStorage('selfstudyUserStateId', data.data.user.state_id);
                        saveDataToLocalStorage('selfstudyUserCityId', data.data.user.city_id);
                    }
                })
                .fail(function( jqXHR, textStatus, error ) {
                    // console.log('Error: ', error);
                });

            }
        }
    }

function cleanUpOldKeys(todayKey) {
    localforage.keys().then(function(keys) {
        keys.forEach(function(key) {
            var isMatch = Object.keys(dailyClickKeyConfig).some(function(prefix) {
                return key.startsWith(prefix + '_');
            });

            if (isMatch && key !== todayKey) {
                localforage.removeItem(key).catch(function(err) {
                    console.error(err);
                });
            }
        });
    }).catch(function(err) {
        console.error(err);
    });
}

function incrementDailyClickCount(storageKeyBase, callback) {
    let today = new Date().toISOString().split('T')[0].replace(/-/g, '_');
    let storageKey = storageKeyBase + '_' + today;

    cleanUpOldKeys(storageKey);

    localforage.getItem(storageKey).then(function(clickCount) {
        if (clickCount === null) { clickCount = 1; } else { clickCount += 1; }
        localforage.setItem(storageKey, clickCount).then(function() {
            callback(clickCount);
        });
    }).catch(function(err) {
        console.error(err);
    });
}

function getLocationByIpAddress() {
    return new Promise((resolve, reject) => {
        // getClientIpAddress()
        //     .then(function(ipdata) {
        //         // console.log('ipdata', ipdata);
        //         var ipaddress = ipdata.data.data.ip;
        //         // console.log('ipaddress', ipaddress);

        //         // const getReq = "https://ipinfo.io/" + ipaddress + "/json";
                
        //     })
        //     .catch(function(error) {
        //         console.log('getClientIpAddress error:', error);
        //         reject(error);
        //     });

        const getReq = "https://pro.ip-api.com/json?key=4LyQVxEeCh2dheZ";
        performGETRequest(getReq, {}, false)
            .then(function(locationData) {
                // console.log('serverData', locationData);
                // console.log('country', locationData.country);
                // console.log('city', locationData.city);
                // console.log('state', locationData.regionName);
                resolve(locationData);
            })
            .catch(function(error) {
                reject(error);
            });
    });
}

// function getClientIpAddress() {
//     return new Promise((resolve, reject) => {
//         getDataFromLocalForage('client_ip_address')
//             .then(function(ip_address_with_timestamp) {
//                 if (ip_address_with_timestamp !== null && !isDataOlderThanOneDay(ip_address_with_timestamp)) {
//                     resolve(ip_address_with_timestamp);
//                 } else {
//                     performGETRequest("https://selfstudys.com:8083/api/v9/gk/get-ip-address", {}, true)
//                         .then(function(serverData) {
//                             if(serverData.status == 'success') {
//                                 const dataToStore = {
//                                     timestamp: new Date().getTime(),
//                                     data: serverData,
//                                 };

//                                 saveDataToLocalForage('client_ip_address', dataToStore)
//                                     .then(function(localSavedData) {
//                                         console.log('getClientIpAddress localSavedData:', localSavedData);
//                                         resolve(localSavedData);
//                                     })
//                                     .catch(function(error) {
//                                         console.log('getClientIpAddress error:', error);
//                                         reject('getClientIpAddress error', error);
//                                     });
//                             }
                            
//                         });
//                 }
//             });
//     });
// }

function getProfileBasicData() {
    return new Promise((resolve, reject) => {
        localforage.getItem('profilebasicdata')
            .then(function(basic_data) {
                if (basic_data !== null && basic_data.data.version >= 2) {
                    resolve(basic_data);
                } else {
                    performGETRequest("https://topcoaching.in/api/get-profile-basic-data", {}, true)
                        .then(function(basic_data) {
                            localforage.setItem('profilebasicdata', basic_data)
                                .then(function() {
                                    resolve(basic_data);
                                })
                                .catch(function(err) {
                                    reject('Error saving ProfileBasicData', err);
                                });
                        })
                        .catch(reject); // Reject the outer promise with the error from the server request
                }
            })
            .catch(function(err) {
                reject('Error in getting profileBasicDataFromLocal', err);
            });
    });
}

function createSelectBoxItemCompleteProfileForm(itemValue, itemName, isSelected) {
    var isSelectedMarked = '';
    if(isSelected) { isSelectedMarked = ' selected'; }
    return '<option value="' + itemValue + '"' + isSelectedMarked + '>' + itemName + '</option>';
}

function updateUserProfileToServer(uuid, name, phone, class_id, stream_id, board_id, state_id, city_id, gender, dob) {
    const payload = {'application_id': 'com.selfstudys', 'app_version': 1 , 'uuid': uuid};

    if (checkIfValueIsCorrect(name)) { payload.name = name; }
    if (checkIfValueIsCorrect(phone)) { payload.phone = phone; }
    if (checkIfValueIsCorrect(board_id) && board_id > 0) { payload.board_id = board_id; }
    if (checkIfValueIsCorrect(state_id) && state_id > 0) { payload.state_id = state_id; }
    if (checkIfValueIsCorrect(city_id) && city_id > 0) { payload.city_id = city_id; }
    if (checkIfValueIsCorrect(gender) && gender > 0) { payload.gender = gender; }
    if (checkIfValueIsCorrect(dob)) { payload.dob = dob; }

    if (checkIfValueIsCorrect(stream_id) && stream_id > 0) { 
        payload.class_id = stream_id; 
    } else if (checkIfValueIsCorrect(class_id) && class_id > 0) {
        payload.class_id = class_id; 
    }

    return new Promise(function(resolve, reject) {
        $.ajax({
            method: 'POST',
            url: "https://topcoaching.in/api/update-user-profile-v2",
            dataType: 'json',
            data: payload
        })
        .done(function(serverUserData) {
            if (serverUserData.status === "success") {
                if(serverUserData.data.status > 0) {
                    getProfileBasicData()
                        .then(function(basic_data) {

                            // console.log('Name', serverUserData.data.user.name);
                            // console.log('Phone1', serverUserData.data.user.phone);
                            // console.log('Phone2', serverUserData.data.user.phone_verified);
                            // console.log('selfstudyUserClassId', class_id);
                            // console.log('selfstudyUserStreamId', stream_id);
                            // console.log('selfstudyUserBoardId', serverUserData.data.user.board_id);
                            // console.log('selfstudyUserStateId', serverUserData.data.user.state_id);
                            // console.log('selfstudyUserCityId', serverUserData.data.user.city_id);

                            if (checkIfValueIsCorrect(serverUserData.data.user.name)) { saveDataToLocalStorage('selfstudyUserDisplayName', serverUserData.data.user.name); }
                            if (checkIfValueIsCorrect(serverUserData.data.user.phone)) { saveDataToLocalStorage('selfstudyUserPhone', serverUserData.data.user.phone); }
                            if (checkIfValueIsCorrect(serverUserData.data.user.phone_verified)) { saveDataToLocalStorage('selfstudyUserPhoneVerified', serverUserData.data.user.phone_verified); }

                            if (checkIfValueIsCorrect(class_id) && class_id > 0) { saveDataToLocalStorage('selfstudyUserClassId', class_id); }
                            if (checkIfValueIsCorrect(stream_id) && stream_id > 0) { saveDataToLocalStorage('selfstudyUserStreamId', stream_id); }
                            if (checkIfValueIsCorrect(serverUserData.data.user.board_id) && serverUserData.data.user.board_id > 0) { saveDataToLocalStorage('selfstudyUserBoardId', serverUserData.data.user.board_id); }
                            if (checkIfValueIsCorrect(serverUserData.data.user.state_id) && serverUserData.data.user.state_id > 0) { saveDataToLocalStorage('selfstudyUserStateId', serverUserData.data.user.state_id); }
                            if (checkIfValueIsCorrect(serverUserData.data.user.city_id) && serverUserData.data.user.city_id > 0) { saveDataToLocalStorage('selfstudyUserCityId', serverUserData.data.user.city_id); }

                            if (checkIfValueIsCorrect(serverUserData.data.user.gender) && serverUserData.data.user.gender > 0) { saveDataToLocalStorage('selfstudyUserGender', serverUserData.data.user.gender); }
                            if (checkIfValueIsCorrect(serverUserData.data.user.dob)) { saveDataToLocalStorage('selfstudyUserDOB', serverUserData.data.user.dob); }

                            $.each(basic_data.data.class_exams, function(index, item) { if (item.id == class_id) { saveDataToLocalStorage('selfstudyUserClassName', item.title); return false; } });

                            $.each(basic_data.data.class_exams, function(index, item) { if (item.id == stream_id) { saveDataToLocalStorage('selfstudyUserStreamName', item.title); return false; } });

                            $.each(basic_data.data.boards, function(index, item) { if (item.id == serverUserData.data.user.board_id) { saveDataToLocalStorage('selfstudyUserBoardName', item.title); return false; } });

                            $.each(basic_data.data.states, function(index, item) { if (item.id == serverUserData.data.user.state_id) { saveDataToLocalStorage('selfstudyUserStateName', item.title); return false; } });

                            $.each(basic_data.data.cities, function(index, item) { if (item.id == serverUserData.data.user.city_id) { saveDataToLocalStorage('selfstudyUserCityName', item.title); return false; } });
                            
                            resolve(serverUserData);
                        });
                } else {
                    reject(new Error("Update failed. " + serverUserData.data.message));
                }
            } else {
                reject(new Error("Update failed"));
            }
        })
        .fail(function(jqXHR, textStatus, error) {
            console.log('Error: ', error);
            reject(new Error("AJAX request failed"));
        });
    });
}


$('#saveCompleteProfileFormData').click(function(event) {
    event.preventDefault();

    var name = $('#cpfName').val();
    var mobile = $('#cpfMobile').val();
    var classId = $('#cpfClass').val();
    var streamId = $('#cpfStream').val();
    var boardId = $('#cpfBoard').val();
    var stateId = $('#cpfState').val();
    var cityId = $('#cpfCity').val();
    var agreeTerms = $('#cpfTandC').is(':checked');

    // if (name === '') { alert('Please enter your name.'); return; }
    // if (mobile === '') { alert('Please enter your mobile number.'); return; }
    // if (classId === '0') { alert('Please select a class.'); return; }
    // if (streamId === '0') { alert('Please select a stream.'); return; }
    // if (boardId === '0') { alert('Please select a board.'); return; }
    // if (stateId === '0') { alert('Please select a state.'); return; }
    // if (cityId === '0') { alert('Please select a city.'); return; }
    
    if (!agreeTerms) { alert('Please agree to the Terms of Use and Privacy Policy.'); return; }

    if(checkIfValueIsCorrect(getUserUUID())) {
        updateUserProfileToServer(getUserUUID(), name, mobile, classId, streamId, boardId, stateId, cityId, '', '')
            .then(function(data) {
                $('.completeprofileform').addClass('hideThis');
                // alert('Profile Updated Successfully.');

                if(
                    checkIfValueIsCorrect(getDataFromLocalStorage('selfstudyUserPhone')) && 
                    !checkIfValueIsCorrect(getDataFromLocalStorage('selfstudyUserPhoneVerified'))
                ) {
                    isMobileVerifyOrLogin = 3; //embededPop
                    generateOTP(null, 1);
                }
            })
            .catch(function(error) {
                console.log('Error:', error.message);
                alert('Error in updaing Profile data ' + error.message);
            });
    }
});

$(document).ready(function() {

    
    getProfileBasicData()
        .then(function(basic_data) {
            // console.log('basic_data', basic_data);

            $.each(basic_data.data.class_exams, function(index, item) {
                if(item.parent_id == 1) {
                    $('#userDetailsPopupClass').append(createSelectBoxItem(item.title, item.id, 'classItem'));
                }
            });

            $.each(basic_data.data.boards, function(index, item) {
                $('#userDetailsPopupBoard').append(createSelectBoxItem(item.title, item.id, 'boardItem'));
            });

            $.each(basic_data.data.states, function(index, item) {
                $('#userDetailsPopupState').append(createSelectBoxItem(item.title, item.id, 'stateItem'));
            });

            //Field Filter Options
            $('#classInputField').on('keyup', function() {
                let searchTerm = $(this).val();
                filterDropdown($('.classItem'), searchTerm);
            });
            $('#streamInputField').on('keyup', function() {
                let searchTerm = $(this).val();
                filterDropdown($('.streamItem'), searchTerm);
            });
            $('#boardInputField').on('keyup', function() {
                let searchTerm = $(this).val();
                filterDropdown($('.boardItem'), searchTerm);  
            });
            $('#stateInputField').on('keyup', function() {
                let searchTerm = $(this).val();
                filterDropdown($('.stateItem'), searchTerm);  
            });
            $('#cityInputField').on('keyup', function() {
                let searchTerm = $(this).val();
                filterDropdown($('.cityItem'), searchTerm);  
            });
            function filterDropdown($items, searchTerm) {
                $items.each(function() {
                    let text = $(this).text().toLowerCase();
                    searchTerm = searchTerm.toLowerCase();
                    $(this).toggle(text.includes(searchTerm)); 
                });
            }
            
            //Field Option Clicks
            $(document).on('click', '.classItem', function() {
                selectedClassId = $(this).data('value'); 
                userProfileClass = $(this).html();
                updateSelectedLabel('.classDropdown', userProfileClass);

                saveUserProfileData(1);
                
                $('#userDetailsPopupStream').html('');
                updateSelectedLabel('.streamDropdown', 'Select Stream');
                $('#udStreamFormGroup').addClass('hideThis');
                selectedStreamId = 0;

                let streamItems = basic_data.data.class_exams.filter(item => item.parent_id == selectedClassId);
                if(streamItems.length > 0) {

                    $.each(streamItems, function(index, item) {
                        $('#userDetailsPopupStream').append(createSelectBoxItem(item.title, item.id, 'streamItem'));
                    });

                    $('#udStreamFormGroup').removeClass('hideThis');
                }

                $('#udBoardFormGroup').removeClass('hideThis');
                $('#udStateFormGroup').removeClass('hideThis');
                $('#udCityFormGroup').removeClass('hideThis');
            });
            $(document).on('click', '.streamItem', function() {
                selectedStreamId = $(this).data('value');
                userProfileStream = $(this).html();
                updateSelectedLabel('.streamDropdown', userProfileStream);
            });
            $(document).on('click', '.boardItem', function() {
                selectedBoardId = $(this).data('value');
                userProfileBoard = $(this).html();
                updateSelectedLabel('.boardDropdown', userProfileBoard);
            });
            $(document).on('click', '.stateItem', function() {
                selectedStateId = $(this).data('value');
                userProfileState = $(this).html();
                updateSelectedLabel('.stateDropdown', userProfileState);

                $('#userDetailsPopupCity').html('');
                updateSelectedLabel('.cityDropdown', 'Select City');
                selectedCityId = 0;

                let cityItems = basic_data.data.cities.filter(item => item.parent_id == selectedStateId);
                $.each(cityItems, function(index, item) {
                    $('#userDetailsPopupCity').append(createSelectBoxItem(item.title, item.id, 'cityItem'));
                });
            });
            $(document).on('click', '.cityItem', function() {
                selectedCityId = $(this).data('value');
                userProfileCity = $(this).html();
                updateSelectedLabel('.cityDropdown', userProfileCity);
            });
            function updateSelectedLabel(selector, value) {
                $(selector).find('.dropdown-toggle').html(value);
            }

            const userStateId = getDataFromLocalStorage('selfstudyUserStateId');
            if(checkIfValueIsCorrect(userStateId)) {
                callFnToGetIntrnlCampFromServer();
            } else {
                getLocationByIpAddress()
                    .then(function(locationData) {
                        if(locationData.countryCode == 'IN') {
                            var isStateFound = 0;
                            searchAndFindStateId(basic_data.data.states, locationData.regionName)
                                .then(foundStateId => {
                                    return searchAndFindCityId(basic_data.data.cities, locationData.city, foundStateId)
                                        .then(foundCityId => { return { stateId: foundStateId, cityId: foundCityId }; })
                                        .catch(() => { return { stateId: foundStateId, cityId: 0 }; });
                                })
                                .then(ids => {

                                    let payload = { 'state_id': ids.stateId,'city_id': ids.cityId,'state_name': locationData.regionName, 'city_name': locationData.city }

                                    if(checkIfValueIsCorrect(getUserUUID())) {
                                        performPOSTRequest("https://topcoaching.in/api/save-user-state-and-city-id", payload, true)
                                            .then(function(serverStateCityData) {
                                                
                                                if(serverStateCityData.status == "success" && serverStateCityData.data.status == 1) {
                                                    saveDataToLocalStorage('selfstudyUserStateId', serverStateCityData.data.state_id);
                                                    if(serverStateCityData.data.city_id > 0) {
                                                        saveDataToLocalStorage('selfstudyUserCityId', serverStateCityData.data.city_id);
                                                    }

                                                    callFnToGetIntrnlCampFromServer();
                                                }
                                            })
                                            .catch(function(error) {
                                                console.log('Error:', error);
                                            });
                                    } else {
                                        saveDataToLocalStorage('selfstudyUserStateId', ids.stateId);
                                        saveDataToLocalStorage('selfstudyUserCityId', ids.cityId);
                                    }
                                })
                                .catch(error => {
                                    console.error(error);
                                    let payload = { 'search_find_state_id': error };
                                    performGETRequest("https://topcoaching.in/api/log-seflstudy-web-error", payload, false);
                                });
                        } else {
                            // console.log('OutsideIndia');
                        }
                    })
                    .catch(function(error) {
                        let payload = { 'get_location_by_ip_address': error };
                        performGETRequest("https://topcoaching.in/api/log-seflstudy-web-error", payload, false);
                    });
            }
        })
        .catch(function(error) {
            console.log('Error2:', error);
        });

    function searchAndFindStateId(states, stateName) {
        if(stateName == 'National Capital Territory of Delhi') { stateName = 'Delhi'; }
        return new Promise((resolve, reject) => {
            stateName = convertUnicodeToString(stateName);
            const foundState = states.find(state => state.title === stateName);
            if (foundState) {
                resolve(foundState.id);
            } else {
                // console.log('stateName: ' + stateName);
                reject("State not found: " + stateName);
            }
        });
    }

    function searchAndFindCityId(cities, cityName, stateId) {
        return new Promise((resolve, reject) => {
            cityName = convertUnicodeToString(cityName);
            const city = cities
                .filter(item => item.parent_id === stateId)
                .find(item => item.title === cityName);

            if (city && city.id) {
                resolve(city.id);
            } else {
                reject(new Error(`City "${cityName}" not found in state with ID ${stateId}`));
            }
        });
    }

    if ($('div.completeprofileform').length > 0) {
        if(checkIfValueIsCorrect(getUserUUID())) {
            let needToShowForm = false;

            const cpfClassId    = getDataFromLocalStorage('selfstudyUserClassId');
            const cpfStreamId   = getDataFromLocalStorage('selfstudyUserStreamId');
            const cpfBoardId    = getDataFromLocalStorage('selfstudyUserBoardId');
            const cpfStateId    = getDataFromLocalStorage('selfstudyUserStateId');
            const cpfCityId     = getDataFromLocalStorage('selfstudyUserCityId');

            // console.log('cpfClassId: ' + cpfClassId);
            // console.log('cpfStreamId: ' + cpfStreamId);
            // console.log('cpfBoardId: ' + cpfBoardId);
            // console.log('cpfStateId: ' + cpfStateId);
            // console.log('cpfCityId: ' + cpfCityId);

            getProfileBasicData()
                .then(function(basic_data) {
                    // console.log('getProfileBasicData2 basic_data->', basic_data);

                    $('#cpfClass').on('change', function() {
                        var selectedClassId = $(this).val();

                        $('#cpfStream').html('<option id="0">Select Stream</option>');
                        let cpfStreamItems2 = basic_data.data.class_exams.filter(item => item.parent_id == selectedClassId);
                        
                        if(cpfStreamItems2.length > 0) {
                            $.each(cpfStreamItems2, function(index, item) {
                                $('#cpfStream').append(createSelectBoxItemCompleteProfileForm(item.id, item.title, false));
                            });
                            $('#cpfStreamDiv').removeClass('hideThis');
                        } else {
                            $('#cpfStreamDiv').addClass('hideThis');
                        }
                    });

                    $('#cpfState').on('change', function() {
                        var selectedStateId = $(this).val();
                        
                        $('#cpfCity').html('<option id="0">Select City</option>');
                        let cpfCityItems2 = basic_data.data.cities.filter(item => item.parent_id == selectedStateId);
                        
                        if(cpfCityItems2.length > 0) {
                            $.each(cpfCityItems2, function(index, item) {
                                $('#cpfCity').append(createSelectBoxItemCompleteProfileForm(item.id, item.title, false));
                            });
                            $('#cpfCityDiv').removeClass('hideThis');
                        } else {
                            $('#cpfCityDiv').addClass('hideThis');
                        }
                    });

                    if(checkIfValueIsCorrect(getDataFromLocalStorage('selfstudyUserDisplayName'))) {
                        $('#cpfName').val(getDataFromLocalStorage('selfstudyUserDisplayName'));
                    }

                    if(!checkIfValueIsCorrect(getDataFromLocalStorage('selfstudyUserPhone'))) {
                        $('#cpfMobileDiv').removeClass('hideThis');
                        needToShowForm = true;
                    }

                    if( !checkIfValueIsCorrect(cpfClassId) || !checkIfValueIsCorrect(cpfStreamId) || cpfClassId == 0 || cpfStreamId == 0 ) {
                        
                        if( checkIfValueIsCorrect(cpfClassId) && cpfClassId > 2 && cpfClassId < 13 ) {
                            //No need to show class,stream
                        } else {
                            $.each(basic_data.data.class_exams, function(index, item) {
                                if(item.parent_id == 1) {
                                    if(item.id == cpfClassId) { var isSelected = true; } else { var isSelected = false; }
                                    $('#cpfClass').append(createSelectBoxItemCompleteProfileForm(item.id, item.title, isSelected));
                                }
                            });

                            if(cpfClassId > 0) {
                                let cpfStreamItems = basic_data.data.class_exams.filter(item => item.parent_id == cpfClassId);
                                $.each(cpfStreamItems, function(index, item) {
                                    if(item.id == cpfStreamId) { var isSelected = true; } else { var isSelected = false; }
                                    $('#cpfStream').append(createSelectBoxItemCompleteProfileForm(item.id, item.title, isSelected));
                                });
                            }

                            $('#cpfClassDiv, #cpfStreamDiv').removeClass('hideThis');
                            needToShowForm = true;
                        }
                    }

                    if( !checkIfValueIsCorrect(cpfStateId) || !checkIfValueIsCorrect(cpfCityId) || cpfStateId == 0 || cpfCityId == 0 ) {
                        $.each(basic_data.data.states, function(index, item) {
                            if(item.id == cpfStateId) { var isSelected = true; } else { var isSelected = false; }
                            $('#cpfState').append(createSelectBoxItemCompleteProfileForm(item.id, item.title, isSelected));
                        });

                        if(cpfStateId > 0) {
                            let cpfCityItems = basic_data.data.cities.filter(item => item.parent_id == cpfStateId);
                            $.each(cpfCityItems, function(index, item) {
                                if(item.id == cpfCityId) { var isSelected = true; } else { var isSelected = false; }
                                $('#cpfCity').append(createSelectBoxItemCompleteProfileForm(item.id, item.title, isSelected));
                            });
                        }

                        $('#cpfStateDiv, #cpfCityDiv').removeClass('hideThis');
                        needToShowForm = true;
                    }

                    if( !checkIfValueIsCorrect(cpfBoardId) || cpfBoardId == 0 ) {
                        $.each(basic_data.data.boards, function(index, item) {
                            if(item.id == cpfBoardId) { var isSelected = true; } else { var isSelected = false; }
                            $('#cpfBoard').append(createSelectBoxItemCompleteProfileForm(item.id, item.title, isSelected));
                        });
                        
                        $('#cpfBoardDiv').removeClass('hideThis');
                        needToShowForm = true;
                    }

                    if(needToShowForm) {
                        $('#cpfNameDiv').removeClass('hideThis');
                        $('.completeprofileform').removeClass('hideThis');
                    }
                })
                .catch(function(error) {
                    console.log('Error:', error);
                });
        }
    }

    $('#loginMobileNumber').val(getDataFromLocalStorage('selfstudyUserPhone'));

    $('#totp1').on('input', function() {
        var val = $(this).val();
        if ($.isNumeric(val)) {
            $('#totp2').focus();
        } else {
            $(this).val('');
        }
    });

    $('#totp2').on('input', function() {
        var val = $(this).val();
        if ($.isNumeric(val)) {
            $('#totp3').focus();
        } else {
            $(this).val('');
        }
    });

    $('#totp3').on('input', function() {
        var val = $(this).val();
        if ($.isNumeric(val)) {
            $('#totp4').focus();
        } else {
            $(this).val('');
        }
    });

    $('#totp4').on('input', function() {
        var val = $(this).val();
        if ($.isNumeric(val)) {
            $('#loginVerifyOTP').click();
        } else {
            $(this).val('');
        }
    });

    //RemoveThisIfConditionWhenNewLoginFullyRollout
    // if(checkIfValueIsCorrect(getDataFromLocalStorage('selfstudyFirebaseToken')) && !checkIfValueIsCorrect(getUserUUID())) {
    //     logoutUser(0);
    // }

    if (window.innerWidth <= 767) {
        if(checkIfValueIsCorrect(getUserUUID())) {
            var totalPerc = setAndGetProfileComplitionPercentage();

            if(totalPerc < 100) { 
                $('#complete-profile-bottom-link').attr('href', '/user/profile-edit'); 
                $('#user-profile-completed-footer').removeClass('hideThis'); 
            }
        } else {
            $('#complete-profile-bottom-link').addClass('showSignupPopup');
            $('#user-profile-completed-footer').removeClass('hideThis');
        }
    }

    Object.keys(dailyClickKeyConfig).forEach(function(keyPrefix) {
        if(!checkIfValueIsCorrect(getUserUUID())) {
            $('.' + dailyClickKeyConfig[keyPrefix]).on('click', function(event) {
                event.preventDefault();
                let link = $(this);

                incrementDailyClickCount(keyPrefix, function(clickCount) {
                    if (clickCount < 4) {
                        window.open(link.attr('href'), '_blank');
                    } else {
                        if(!checkIfValueIsCorrect(getUserUUID())) {
                            loginSource = keyPrefix;
                            if(loginSource == 'pdfclicks') {
                                $('#signuppopupHeaderTitle').html('Unlock FREE Unlimited Access with a Login!');
                            }
                            $('#modalLogin').modal('show');
                        } else {
                            window.open(link.attr('href'), '_blank');
                        }
                    }
                });
            });
        }
    });
    
});








































  (function e(t, r) {
      if (typeof exports === "object" && typeof module === "object")
          module.exports = r();
      else if (typeof define === "function" && define.amd)
          define("pdfjs-dist/build/pdf", [], r);
      else if (typeof exports === "object")
          exports["pdfjs-dist/build/pdf"] = r();
      else
          t["pdfjs-dist/build/pdf"] = t.pdfjsDistBuildPdf = r()
  }
  )(this, function() {
      return function(e) {
          var t = {};
          function r(n) {
              if (t[n]) {
                  return t[n].exports
              }
              var a = t[n] = {
                  i: n,
                  l: false,
                  exports: {}
              };
              e[n].call(a.exports, a, a.exports, r);
              a.l = true;
              return a.exports
          }
          r.m = e;
          r.c = t;
          r.i = function(e) {
              return e
          }
          ;
          r.d = function(e, t, n) {
              if (!r.o(e, t)) {
                  Object.defineProperty(e, t, {
                      configurable: false,
                      enumerable: true,
                      get: n
                  })
              }
          }
          ;
          r.n = function(e) {
              var t = e && e.__esModule ? function t() {
                  return e["default"]
              }
              : function t() {
                  return e
              }
              ;
              r.d(t, "a", t);
              return t
          }
          ;
          r.o = function(e, t) {
              return Object.prototype.hasOwnProperty.call(e, t)
          }
          ;
          r.p = "";
          return r(r.s = 15)
      }([function(e, t, r) {
          "use strict";
          Object.defineProperty(t, "__esModule", {
              value: true
          });
          t.unreachable = t.warn = t.utf8StringToString = t.stringToUTF8String = t.stringToPDFString = t.stringToBytes = t.string32 = t.shadow = t.setVerbosityLevel = t.ReadableStream = t.removeNullCharacters = t.readUint32 = t.readUint16 = t.readInt8 = t.log2 = t.loadJpegStream = t.isEvalSupported = t.isLittleEndian = t.createValidAbsoluteUrl = t.isSameOrigin = t.isNodeJS = t.isSpace = t.isString = t.isNum = t.isInt = t.isEmptyObj = t.isBool = t.isArrayBuffer = t.isArray = t.info = t.globalScope = t.getVerbosityLevel = t.getLookupTableFactory = t.deprecated = t.createObjectURL = t.createPromiseCapability = t.createBlob = t.bytesToString = t.assert = t.arraysToBytes = t.arrayByteLength = t.FormatError = t.XRefParseException = t.Util = t.UnknownErrorException = t.UnexpectedResponseException = t.TextRenderingMode = t.StreamType = t.StatTimer = t.PasswordResponses = t.PasswordException = t.PageViewport = t.NotImplementedException = t.NativeImageDecoding = t.MissingPDFException = t.MissingDataException = t.MessageHandler = t.InvalidPDFException = t.AbortException = t.CMapCompressionType = t.ImageKind = t.FontType = t.AnnotationType = t.AnnotationFlag = t.AnnotationFieldFlag = t.AnnotationBorderStyleType = t.UNSUPPORTED_FEATURES = t.VERBOSITY_LEVELS = t.OPS = t.IDENTITY_MATRIX = t.FONT_IDENTITY_MATRIX = undefined;
          var n = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(e) {
              return typeof e
          }
          : function(e) {
              return e && typeof Symbol === "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
          }
          ;
          r(16);
          var a = r(17);
          var i = typeof window !== "undefined" && window.Math === Math ? window : typeof global !== "undefined" && global.Math === Math ? global : typeof self !== "undefined" && self.Math === Math ? self : undefined;
          var s = [.001, 0, 0, .001, 0, 0];
          var o = {
              NONE: "none",
              DECODE: "decode",
              DISPLAY: "display"
          };
          var l = {
              FILL: 0,
              STROKE: 1,
              FILL_STROKE: 2,
              INVISIBLE: 3,
              FILL_ADD_TO_PATH: 4,
              STROKE_ADD_TO_PATH: 5,
              FILL_STROKE_ADD_TO_PATH: 6,
              ADD_TO_PATH: 7,
              FILL_STROKE_MASK: 3,
              ADD_TO_PATH_FLAG: 4
          };
          var u = {
              GRAYSCALE_1BPP: 1,
              RGB_24BPP: 2,
              RGBA_32BPP: 3
          };
          var c = {
              TEXT: 1,
              LINK: 2,
              FREETEXT: 3,
              LINE: 4,
              SQUARE: 5,
              CIRCLE: 6,
              POLYGON: 7,
              POLYLINE: 8,
              HIGHLIGHT: 9,
              UNDERLINE: 10,
              SQUIGGLY: 11,
              STRIKEOUT: 12,
              STAMP: 13,
              CARET: 14,
              INK: 15,
              POPUP: 16,
              FILEATTACHMENT: 17,
              SOUND: 18,
              MOVIE: 19,
              WIDGET: 20,
              SCREEN: 21,
              PRINTERMARK: 22,
              TRAPNET: 23,
              WATERMARK: 24,
              THREED: 25,
              REDACT: 26
          };
          var f = {
              INVISIBLE: 1,
              HIDDEN: 2,
              PRINT: 4,
              NOZOOM: 8,
              NOROTATE: 16,
              NOVIEW: 32,
              READONLY: 64,
              LOCKED: 128,
              TOGGLENOVIEW: 256,
              LOCKEDCONTENTS: 512
          };
          var d = {
              READONLY: 1,
              REQUIRED: 2,
              NOEXPORT: 4,
              MULTILINE: 4096,
              PASSWORD: 8192,
              NOTOGGLETOOFF: 16384,
              RADIO: 32768,
              PUSHBUTTON: 65536,
              COMBO: 131072,
              EDIT: 262144,
              SORT: 524288,
              FILESELECT: 1048576,
              MULTISELECT: 2097152,
              DONOTSPELLCHECK: 4194304,
              DONOTSCROLL: 8388608,
              COMB: 16777216,
              RICHTEXT: 33554432,
              RADIOSINUNISON: 33554432,
              COMMITONSELCHANGE: 67108864
          };
          var h = {
              SOLID: 1,
              DASHED: 2,
              BEVELED: 3,
              INSET: 4,
              UNDERLINE: 5
          };
          var p = {
              UNKNOWN: 0,
              FLATE: 1,
              LZW: 2,
              DCT: 3,
              JPX: 4,
              JBIG: 5,
              A85: 6,
              AHX: 7,
              CCF: 8,
              RL: 9
          };
          var v = {
              UNKNOWN: 0,
              TYPE1: 1,
              TYPE1C: 2,
              CIDFONTTYPE0: 3,
              CIDFONTTYPE0C: 4,
              TRUETYPE: 5,
              CIDFONTTYPE2: 6,
              TYPE3: 7,
              OPENTYPE: 8,
              TYPE0: 9,
              MMTYPE1: 10
          };
          var m = {
              errors: 0,
              warnings: 1,
              infos: 5
          };
          var g = {
              NONE: 0,
              BINARY: 1,
              STREAM: 2
          };
          var b = {
              dependency: 1,
              setLineWidth: 2,
              setLineCap: 3,
              setLineJoin: 4,
              setMiterLimit: 5,
              setDash: 6,
              setRenderingIntent: 7,
              setFlatness: 8,
              setGState: 9,
              save: 10,
              restore: 11,
              transform: 12,
              moveTo: 13,
              lineTo: 14,
              curveTo: 15,
              curveTo2: 16,
              curveTo3: 17,
              closePath: 18,
              rectangle: 19,
              stroke: 20,
              closeStroke: 21,
              fill: 22,
              eoFill: 23,
              fillStroke: 24,
              eoFillStroke: 25,
              closeFillStroke: 26,
              closeEOFillStroke: 27,
              endPath: 28,
              clip: 29,
              eoClip: 30,
              beginText: 31,
              endText: 32,
              setCharSpacing: 33,
              setWordSpacing: 34,
              setHScale: 35,
              setLeading: 36,
              setFont: 37,
              setTextRenderingMode: 38,
              setTextRise: 39,
              moveText: 40,
              setLeadingMoveText: 41,
              setTextMatrix: 42,
              nextLine: 43,
              showText: 44,
              showSpacedText: 45,
              nextLineShowText: 46,
              nextLineSetSpacingShowText: 47,
              setCharWidth: 48,
              setCharWidthAndBounds: 49,
              setStrokeColorSpace: 50,
              setFillColorSpace: 51,
              setStrokeColor: 52,
              setStrokeColorN: 53,
              setFillColor: 54,
              setFillColorN: 55,
              setStrokeGray: 56,
              setFillGray: 57,
              setStrokeRGBColor: 58,
              setFillRGBColor: 59,
              setStrokeCMYKColor: 60,
              setFillCMYKColor: 61,
              shadingFill: 62,
              beginInlineImage: 63,
              beginImageData: 64,
              endInlineImage: 65,
              paintXObject: 66,
              markPoint: 67,
              markPointProps: 68,
              beginMarkedContent: 69,
              beginMarkedContentProps: 70,
              endMarkedContent: 71,
              beginCompat: 72,
              endCompat: 73,
              paintFormXObjectBegin: 74,
              paintFormXObjectEnd: 75,
              beginGroup: 76,
              endGroup: 77,
              beginAnnotations: 78,
              endAnnotations: 79,
              beginAnnotation: 80,
              endAnnotation: 81,
              paintJpegXObject: 82,
              paintImageMaskXObject: 83,
              paintImageMaskXObjectGroup: 84,
              paintImageXObject: 85,
              paintInlineImageXObject: 86,
              paintInlineImageXObjectGroup: 87,
              paintImageXObjectRepeat: 88,
              paintImageMaskXObjectRepeat: 89,
              paintSolidColorImageMask: 90,
              constructPath: 91
          };
          var _ = m.warnings;
          function y(e) {
              _ = e
          }
          function A() {
              return _
          }
          function S(e) {
              if (_ >= m.infos) {
                  console.log("Info: " + e)
              }
          }
          function w(e) {
              if (_ >= m.warnings) {
                  console.log("Warning: " + e)
              }
          }
          function P(e) {
              console.log("Deprecated API usage: " + e)
          }
          function C(e) {
              throw new Error(e)
          }
          function k(e, t) {
              if (!e) {
                  C(t)
              }
          }
          var R = {
              unknown: "unknown",
              forms: "forms",
              javaScript: "javaScript",
              smask: "smask",
              shadingPattern: "shadingPattern",
              font: "font"
          };
          function x(e, t) {
              try {
                  var r = new URL(e);
                  if (!r.origin || r.origin === "null") {
                      return false
                  }
              } catch (e) {
                  return false
              }
              var n = new URL(t,r);
              return r.origin === n.origin
          }
          function T(e) {
              if (!e) {
                  return false
              }
              switch (e.protocol) {
              case "http:":
              case "https:":
              case "ftp:":
              case "mailto:":
              case "tel:":
                  return true;
              default:
                  return false
              }
          }
          function E(e, t) {
              if (!e) {
                  return null
              }
              try {
                  var r = t ? new URL(e,t) : new URL(e);
                  if (T(r)) {
                      return r
                  }
              } catch (e) {}
              return null
          }
          function I(e, t, r) {
              Object.defineProperty(e, t, {
                  value: r,
                  enumerable: true,
                  configurable: true,
                  writable: false
              });
              return r
          }
          function L(e) {
              var t;
              return function() {
                  if (e) {
                      t = Object.create(null);
                      e(t);
                      e = null
                  }
                  return t
              }
          }
          var O = {
              NEED_PASSWORD: 1,
              INCORRECT_PASSWORD: 2
          };
          var j = function e() {
              function t(e, t) {
                  this.name = "PasswordException";
                  this.message = e;
                  this.code = t
              }
              t.prototype = new Error;
              t.constructor = t;
              return t
          }();
          var D = function e() {
              function t(e, t) {
                  this.name = "UnknownErrorException";
                  this.message = e;
                  this.details = t
              }
              t.prototype = new Error;
              t.constructor = t;
              return t
          }();
          var F = function e() {
              function t(e) {
                  this.name = "InvalidPDFException";
                  this.message = e
              }
              t.prototype = new Error;
              t.constructor = t;
              return t
          }();
          var N = function e() {
              function t(e) {
                  this.name = "MissingPDFException";
                  this.message = e
              }
              t.prototype = new Error;
              t.constructor = t;
              return t
          }();
          var M = function e() {
              function t(e, t) {
                  this.name = "UnexpectedResponseException";
                  this.message = e;
                  this.status = t
              }
              t.prototype = new Error;
              t.constructor = t;
              return t
          }();
          var q = function e() {
              function t(e) {
                  this.message = e
              }
              t.prototype = new Error;
              t.prototype.name = "NotImplementedException";
              t.constructor = t;
              return t
          }();
          var U = function e() {
              function t(e, t) {
                  this.begin = e;
                  this.end = t;
                  this.message = "Missing data [" + e + ", " + t + ")"
              }
              t.prototype = new Error;
              t.prototype.name = "MissingDataException";
              t.constructor = t;
              return t
          }();
          var W = function e() {
              function t(e) {
                  this.message = e
              }
              t.prototype = new Error;
              t.prototype.name = "XRefParseException";
              t.constructor = t;
              return t
          }();
          var B = function e() {
              function t(e) {
                  this.message = e
              }
              t.prototype = new Error;
              t.prototype.name = "FormatError";
              t.constructor = t;
              return t
          }();
          var z = function e() {
              function t(e) {
                  this.name = "AbortException";
                  this.message = e
              }
              t.prototype = new Error;
              t.constructor = t;
              return t
          }();
          var G = /\x00/g;
          function H(e) {
              if (typeof e !== "string") {
                  w("The argument for removeNullCharacters must be a string.");
                  return e
              }
              return e.replace(G, "")
          }
          function X(e) {
              k(e !== null && (typeof e === "undefined" ? "undefined" : n(e)) === "object" && e.length !== undefined, "Invalid argument for bytesToString");
              var t = e.length;
              var r = 8192;
              if (t < r) {
                  return String.fromCharCode.apply(null, e)
              }
              var a = [];
              for (var i = 0; i < t; i += r) {
                  var s = Math.min(i + r, t);
                  var o = e.subarray(i, s);
                  a.push(String.fromCharCode.apply(null, o))
              }
              return a.join("")
          }
          function Y(e) {
              k(typeof e === "string", "Invalid argument for stringToBytes");
              var t = e.length;
              var r = new Uint8Array(t);
              for (var n = 0; n < t; ++n) {
                  r[n] = e.charCodeAt(n) & 255
              }
              return r
          }
          function V(e) {
              if (e.length !== undefined) {
                  return e.length
              }
              k(e.byteLength !== undefined);
              return e.byteLength
          }
          function J(e) {
              if (e.length === 1 && e[0]instanceof Uint8Array) {
                  return e[0]
              }
              var t = 0;
              var r, n = e.length;
              var a, i;
              for (r = 0; r < n; r++) {
                  a = e[r];
                  i = V(a);
                  t += i
              }
              var s = 0;
              var o = new Uint8Array(t);
              for (r = 0; r < n; r++) {
                  a = e[r];
                  if (!(a instanceof Uint8Array)) {
                      if (typeof a === "string") {
                          a = Y(a)
                      } else {
                          a = new Uint8Array(a)
                      }
                  }
                  i = a.byteLength;
                  o.set(a, s);
                  s += i
              }
              return o
          }
          function Q(e) {
              return String.fromCharCode(e >> 24 & 255, e >> 16 & 255, e >> 8 & 255, e & 255)
          }
          function K(e) {
              var t = 1
                , r = 0;
              while (e > t) {
                  t <<= 1;
                  r++
              }
              return r
          }
          function Z(e, t) {
              return e[t] << 24 >> 24
          }
          function $(e, t) {
              return e[t] << 8 | e[t + 1]
          }
          function ee(e, t) {
              return (e[t] << 24 | e[t + 1] << 16 | e[t + 2] << 8 | e[t + 3]) >>> 0
          }
          function te() {
              var e = new Uint8Array(4);
              e[0] = 1;
              var t = new Uint32Array(e.buffer,0,1);
              return t[0] === 1
          }
          function re() {
              try {
                  new Function("");
                  return true
              } catch (e) {
                  return false
              }
          }
          var ne = [1, 0, 0, 1, 0, 0];
          var ae = function e() {
              function t() {}
              var r = ["rgb(", 0, ",", 0, ",", 0, ")"];
              t.makeCssRgb = function e(t, n, a) {
                  r[1] = t;
                  r[3] = n;
                  r[5] = a;
                  return r.join("")
              }
              ;
              t.transform = function e(t, r) {
                  return [t[0] * r[0] + t[2] * r[1], t[1] * r[0] + t[3] * r[1], t[0] * r[2] + t[2] * r[3], t[1] * r[2] + t[3] * r[3], t[0] * r[4] + t[2] * r[5] + t[4], t[1] * r[4] + t[3] * r[5] + t[5]]
              }
              ;
              t.applyTransform = function e(t, r) {
                  var n = t[0] * r[0] + t[1] * r[2] + r[4];
                  var a = t[0] * r[1] + t[1] * r[3] + r[5];
                  return [n, a]
              }
              ;
              t.applyInverseTransform = function e(t, r) {
                  var n = r[0] * r[3] - r[1] * r[2];
                  var a = (t[0] * r[3] - t[1] * r[2] + r[2] * r[5] - r[4] * r[3]) / n;
                  var i = (-t[0] * r[1] + t[1] * r[0] + r[4] * r[1] - r[5] * r[0]) / n;
                  return [a, i]
              }
              ;
              t.getAxialAlignedBoundingBox = function e(r, n) {
                  var a = t.applyTransform(r, n);
                  var i = t.applyTransform(r.slice(2, 4), n);
                  var s = t.applyTransform([r[0], r[3]], n);
                  var o = t.applyTransform([r[2], r[1]], n);
                  return [Math.min(a[0], i[0], s[0], o[0]), Math.min(a[1], i[1], s[1], o[1]), Math.max(a[0], i[0], s[0], o[0]), Math.max(a[1], i[1], s[1], o[1])]
              }
              ;
              t.inverseTransform = function e(t) {
                  var r = t[0] * t[3] - t[1] * t[2];
                  return [t[3] / r, -t[1] / r, -t[2] / r, t[0] / r, (t[2] * t[5] - t[4] * t[3]) / r, (t[4] * t[1] - t[5] * t[0]) / r]
              }
              ;
              t.apply3dTransform = function e(t, r) {
                  return [t[0] * r[0] + t[1] * r[1] + t[2] * r[2], t[3] * r[0] + t[4] * r[1] + t[5] * r[2], t[6] * r[0] + t[7] * r[1] + t[8] * r[2]]
              }
              ;
              t.singularValueDecompose2dScale = function e(t) {
                  var r = [t[0], t[2], t[1], t[3]];
                  var n = t[0] * r[0] + t[1] * r[2];
                  var a = t[0] * r[1] + t[1] * r[3];
                  var i = t[2] * r[0] + t[3] * r[2];
                  var s = t[2] * r[1] + t[3] * r[3];
                  var o = (n + s) / 2;
                  var l = Math.sqrt((n + s) * (n + s) - 4 * (n * s - i * a)) / 2;
                  var u = o + l || 1;
                  var c = o - l || 1;
                  return [Math.sqrt(u), Math.sqrt(c)]
              }
              ;
              t.normalizeRect = function e(t) {
                  var r = t.slice(0);
                  if (t[0] > t[2]) {
                      r[0] = t[2];
                      r[2] = t[0]
                  }
                  if (t[1] > t[3]) {
                      r[1] = t[3];
                      r[3] = t[1]
                  }
                  return r
              }
              ;
              t.intersect = function e(r, n) {
                  function a(e, t) {
                      return e - t
                  }
                  var i = [r[0], r[2], n[0], n[2]].sort(a)
                    , s = [r[1], r[3], n[1], n[3]].sort(a)
                    , o = [];
                  r = t.normalizeRect(r);
                  n = t.normalizeRect(n);
                  if (i[0] === r[0] && i[1] === n[0] || i[0] === n[0] && i[1] === r[0]) {
                      o[0] = i[1];
                      o[2] = i[2]
                  } else {
                      return false
                  }
                  if (s[0] === r[1] && s[1] === n[1] || s[0] === n[1] && s[1] === r[1]) {
                      o[1] = s[1];
                      o[3] = s[2]
                  } else {
                      return false
                  }
                  return o
              }
              ;
              t.sign = function e(t) {
                  return t < 0 ? -1 : 1
              }
              ;
              var n = ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM", "", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC", "", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
              t.toRoman = function e(t, r) {
                  k(de(t) && t > 0, "The number should be a positive integer.");
                  var a, i = [];
                  while (t >= 1e3) {
                      t -= 1e3;
                      i.push("M")
                  }
                  a = t / 100 | 0;
                  t %= 100;
                  i.push(n[a]);
                  a = t / 10 | 0;
                  t %= 10;
                  i.push(n[10 + a]);
                  i.push(n[20 + t]);
                  var s = i.join("");
                  return r ? s.toLowerCase() : s
              }
              ;
              t.appendToArray = function e(t, r) {
                  Array.prototype.push.apply(t, r)
              }
              ;
              t.prependToArray = function e(t, r) {
                  Array.prototype.unshift.apply(t, r)
              }
              ;
              t.extendObj = function e(t, r) {
                  for (var n in r) {
                      t[n] = r[n]
                  }
              }
              ;
              t.getInheritableProperty = function e(t, r, n) {
                  while (t && !t.has(r)) {
                      t = t.get("Parent")
                  }
                  if (!t) {
                      return null
                  }
                  return n ? t.getArray(r) : t.get(r)
              }
              ;
              t.inherit = function e(t, r, n) {
                  t.prototype = Object.create(r.prototype);
                  t.prototype.constructor = t;
                  for (var a in n) {
                      t.prototype[a] = n[a]
                  }
              }
              ;
              t.loadScript = function e(t, r) {
                  var n = document.createElement("script");
                  var a = false;
                  n.setAttribute("src", t);
                  if (r) {
                      n.onload = function() {
                          if (!a) {
                              r()
                          }
                          a = true
                      }
                  }
                  document.getElementsByTagName("head")[0].appendChild(n)
              }
              ;
              return t
          }();
          var ie = function e() {
              function t(e, t, r, n, a, i) {
                  this.viewBox = e;
                  this.scale = t;
                  this.rotation = r;
                  this.offsetX = n;
                  this.offsetY = a;
                  var s = (e[2] + e[0]) / 2;
                  var o = (e[3] + e[1]) / 2;
                  var l, u, c, f;
                  r = r % 360;
                  r = r < 0 ? r + 360 : r;
                  switch (r) {
                  case 180:
                      l = -1;
                      u = 0;
                      c = 0;
                      f = 1;
                      break;
                  case 90:
                      l = 0;
                      u = 1;
                      c = 1;
                      f = 0;
                      break;
                  case 270:
                      l = 0;
                      u = -1;
                      c = -1;
                      f = 0;
                      break;
                  default:
                      l = 1;
                      u = 0;
                      c = 0;
                      f = -1;
                      break
                  }
                  if (i) {
                      c = -c;
                      f = -f
                  }
                  var d, h;
                  var p, v;
                  if (l === 0) {
                      d = Math.abs(o - e[1]) * t + n;
                      h = Math.abs(s - e[0]) * t + a;
                      p = Math.abs(e[3] - e[1]) * t;
                      v = Math.abs(e[2] - e[0]) * t
                  } else {
                      d = Math.abs(s - e[0]) * t + n;
                      h = Math.abs(o - e[1]) * t + a;
                      p = Math.abs(e[2] - e[0]) * t;
                      v = Math.abs(e[3] - e[1]) * t
                  }
                  this.transform = [l * t, u * t, c * t, f * t, d - l * t * s - c * t * o, h - u * t * s - f * t * o];
                  this.width = p;
                  this.height = v;
                  this.fontScale = t
              }
              t.prototype = {
                  clone: function e(r) {
                      r = r || {};
                      var n = "scale"in r ? r.scale : this.scale;
                      var a = "rotation"in r ? r.rotation : this.rotation;
                      return new t(this.viewBox.slice(),n,a,this.offsetX,this.offsetY,r.dontFlip)
                  },
                  convertToViewportPoint: function e(t, r) {
                      return ae.applyTransform([t, r], this.transform)
                  },
                  convertToViewportRectangle: function e(t) {
                      var r = ae.applyTransform([t[0], t[1]], this.transform);
                      var n = ae.applyTransform([t[2], t[3]], this.transform);
                      return [r[0], r[1], n[0], n[1]]
                  },
                  convertToPdfPoint: function e(t, r) {
                      return ae.applyInverseTransform([t, r], this.transform)
                  }
              };
              return t
          }();
          var se = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 728, 711, 710, 729, 733, 731, 730, 732, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8226, 8224, 8225, 8230, 8212, 8211, 402, 8260, 8249, 8250, 8722, 8240, 8222, 8220, 8221, 8216, 8217, 8218, 8482, 64257, 64258, 321, 338, 352, 376, 381, 305, 322, 339, 353, 382, 0, 8364];
          function oe(e) {
              var t, r = e.length, n = [];
              if (e[0] === "þ" && e[1] === "ÿ") {
                  for (t = 2; t < r; t += 2) {
                      n.push(String.fromCharCode(e.charCodeAt(t) << 8 | e.charCodeAt(t + 1)))
                  }
              } else {
                  for (t = 0; t < r; ++t) {
                      var a = se[e.charCodeAt(t)];
                      n.push(a ? String.fromCharCode(a) : e.charAt(t))
                  }
              }
              return n.join("")
          }
          function le(e) {
              return decodeURIComponent(escape(e))
          }
          function ue(e) {
              return unescape(encodeURIComponent(e))
          }
          function ce(e) {
              for (var t in e) {
                  return false
              }
              return true
          }
          function fe(e) {
              return typeof e === "boolean"
          }
          function de(e) {
              return typeof e === "number" && (e | 0) === e
          }
          function he(e) {
              return typeof e === "number"
          }
          function pe(e) {
              return typeof e === "string"
          }
          function ve(e) {
              return e instanceof Array
          }
          function me(e) {
              return (typeof e === "undefined" ? "undefined" : n(e)) === "object" && e !== null && e.byteLength !== undefined
          }
          function ge(e) {
              return e === 32 || e === 9 || e === 13 || e === 10
          }
          function be() {
              return (typeof process === "undefined" ? "undefined" : n(process)) === "object" && process + "" === "[object process]"
          }
          function _e() {
              var e = {};
              e.promise = new Promise(function(t, r) {
                  e.resolve = t;
                  e.reject = r
              }
              );
              return e
          }
          var ye = function e() {
              function t(e, t, r) {
                  while (e.length < r) {
                      e += t
                  }
                  return e
              }
              function r() {
                  this.started = Object.create(null);
                  this.times = [];
                  this.enabled = true
              }
              r.prototype = {
                  time: function e(t) {
                      if (!this.enabled) {
                          return
                      }
                      if (t in this.started) {
                          w("Timer is already running for " + t)
                      }
                      this.started[t] = Date.now()
                  },
                  timeEnd: function e(t) {
                      if (!this.enabled) {
                          return
                      }
                      if (!(t in this.started)) {
                          w("Timer has not been started for " + t)
                      }
                      this.times.push({
                          name: t,
                          start: this.started[t],
                          end: Date.now()
                      });
                      delete this.started[t]
                  },
                  toString: function e() {
                      var r, n;
                      var a = this.times;
                      var i = "";
                      var s = 0;
                      for (r = 0,
                      n = a.length; r < n; ++r) {
                          var o = a[r]["name"];
                          if (o.length > s) {
                              s = o.length
                          }
                      }
                      for (r = 0,
                      n = a.length; r < n; ++r) {
                          var l = a[r];
                          var u = l.end - l.start;
                          i += t(l["name"], " ", s) + " " + u + "ms\n"
                      }
                      return i
                  }
              };
              return r
          }();
          var Ae = function e(t, r) {
              if (typeof Blob !== "undefined") {
                  return new Blob([t],{
                      type: r
                  })
              }
              throw new Error('The "Blob" constructor is not supported.')
          };
          var Se = function e() {
              var t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
              return function e(r, n) {
                  var a = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
                  if (!a && URL.createObjectURL) {
                      var i = Ae(r, n);
                      return URL.createObjectURL(i)
                  }
                  var s = "data:" + n + ";base64,";
                  for (var o = 0, l = r.length; o < l; o += 3) {
                      var u = r[o] & 255;
                      var c = r[o + 1] & 255;
                      var f = r[o + 2] & 255;
                      var d = u >> 2
                        , h = (u & 3) << 4 | c >> 4;
                      var p = o + 1 < l ? (c & 15) << 2 | f >> 6 : 64;
                      var v = o + 2 < l ? f & 63 : 64;
                      s += t[d] + t[h] + t[p] + t[v]
                  }
                  return s
              }
          }();
          function we(e, t) {
              var r = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
              if (!e) {
                  return Promise.resolve(undefined)
              }
              return new Promise(function(n, a) {
                  n(e.apply(r, t))
              }
              )
          }
          function Pe(e) {
              if ((typeof e === "undefined" ? "undefined" : n(e)) !== "object") {
                  return e
              }
              switch (e.name) {
              case "AbortException":
                  return new z(e.message);
              case "MissingPDFException":
                  return new N(e.message);
              case "UnexpectedResponseException":
                  return new M(e.message,e.status);
              default:
                  return new D(e.message,e.details)
              }
          }
          function Ce(e, t, r) {
              if (t) {
                  e.resolve()
              } else {
                  e.reject(r)
              }
          }
          function ke(e) {
              return Promise.resolve(e).catch(function() {})
          }
          function Re(e, t, r) {
              var n = this;
              this.sourceName = e;
              this.targetName = t;
              this.comObj = r;
              this.callbackId = 1;
              this.streamId = 1;
              this.postMessageTransfers = true;
              this.streamSinks = Object.create(null);
              this.streamControllers = Object.create(null);
              var a = this.callbacksCapabilities = Object.create(null);
              var i = this.actionHandler = Object.create(null);
              this._onComObjOnMessage = function(e) {
                  var t = e.data;
                  if (t.targetName !== n.sourceName) {
                      return
                  }
                  if (t.stream) {
                      n._processStreamMessage(t)
                  } else if (t.isReply) {
                      var s = t.callbackId;
                      if (t.callbackId in a) {
                          var o = a[s];
                          delete a[s];
                          if ("error"in t) {
                              o.reject(Pe(t.error))
                          } else {
                              o.resolve(t.data)
                          }
                      } else {
                          throw new Error("Cannot resolve callback " + s)
                      }
                  } else if (t.action in i) {
                      var l = i[t.action];
                      if (t.callbackId) {
                          var u = n.sourceName;
                          var c = t.sourceName;
                          Promise.resolve().then(function() {
                              return l[0].call(l[1], t.data)
                          }).then(function(e) {
                              r.postMessage({
                                  sourceName: u,
                                  targetName: c,
                                  isReply: true,
                                  callbackId: t.callbackId,
                                  data: e
                              })
                          }, function(e) {
                              if (e instanceof Error) {
                                  e = e + ""
                              }
                              r.postMessage({
                                  sourceName: u,
                                  targetName: c,
                                  isReply: true,
                                  callbackId: t.callbackId,
                                  error: e
                              })
                          })
                      } else if (t.streamId) {
                          n._createStreamSink(t)
                      } else {
                          l[0].call(l[1], t.data)
                      }
                  } else {
                      throw new Error("Unknown action from worker: " + t.action)
                  }
              }
              ;
              r.addEventListener("message", this._onComObjOnMessage)
          }
          Re.prototype = {
              on: function e(t, r, n) {
                  var a = this.actionHandler;
                  if (a[t]) {
                      throw new Error('There is already an actionName called "' + t + '"')
                  }
                  a[t] = [r, n]
              },
              send: function e(t, r, n) {
                  var a = {
                      sourceName: this.sourceName,
                      targetName: this.targetName,
                      action: t,
                      data: r
                  };
                  this.postMessage(a, n)
              },
              sendWithPromise: function e(t, r, n) {
                  var a = this.callbackId++;
                  var i = {
                      sourceName: this.sourceName,
                      targetName: this.targetName,
                      action: t,
                      data: r,
                      callbackId: a
                  };
                  var s = _e();
                  this.callbacksCapabilities[a] = s;
                  try {
                      this.postMessage(i, n)
                  } catch (e) {
                      s.reject(e)
                  }
                  return s.promise
              },
              sendWithStream: function e(t, r, n, i) {
                  var s = this;
                  var o = this.streamId++;
                  var l = this.sourceName;
                  var u = this.targetName;
                  return new a.ReadableStream({
                      start: function e(n) {
                          var a = _e();
                          s.streamControllers[o] = {
                              controller: n,
                              startCall: a,
                              isClosed: false
                          };
                          s.postMessage({
                              sourceName: l,
                              targetName: u,
                              action: t,
                              streamId: o,
                              data: r,
                              desiredSize: n.desiredSize
                          });
                          return a.promise
                      },
                      pull: function e(t) {
                          var r = _e();
                          s.streamControllers[o].pullCall = r;
                          s.postMessage({
                              sourceName: l,
                              targetName: u,
                              stream: "pull",
                              streamId: o,
                              desiredSize: t.desiredSize
                          });
                          return r.promise
                      },
                      cancel: function e(t) {
                          var r = _e();
                          s.streamControllers[o].cancelCall = r;
                          s.streamControllers[o].isClosed = true;
                          s.postMessage({
                              sourceName: l,
                              targetName: u,
                              stream: "cancel",
                              reason: t,
                              streamId: o
                          });
                          return r.promise
                      }
                  },n)
              },
              _createStreamSink: function e(t) {
                  var r = this;
                  var n = this;
                  var a = this.actionHandler[t.action];
                  var i = t.streamId;
                  var s = t.desiredSize;
                  var o = this.sourceName;
                  var l = t.sourceName;
                  var u = _e();
                  var c = function e(t) {
                      var n = t.stream
                        , a = t.chunk
                        , s = t.transfers
                        , u = t.success
                        , c = t.reason;
                      r.postMessage({
                          sourceName: o,
                          targetName: l,
                          stream: n,
                          streamId: i,
                          chunk: a,
                          success: u,
                          reason: c
                      }, s)
                  };
                  var f = {
                      enqueue: function e(t) {
                          var r = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
                          var n = arguments[2];
                          if (this.isCancelled) {
                              return
                          }
                          var a = this.desiredSize;
                          this.desiredSize -= r;
                          if (a > 0 && this.desiredSize <= 0) {
                              this.sinkCapability = _e();
                              this.ready = this.sinkCapability.promise
                          }
                          c({
                              stream: "enqueue",
                              chunk: t,
                              transfers: n
                          })
                      },
                      close: function e() {
                          if (this.isCancelled) {
                              return
                          }
                          c({
                              stream: "close"
                          });
                          delete n.streamSinks[i]
                      },
                      error: function e(t) {
                          if (this.isCancelled) {
                              return
                          }
                          this.isCancelled = true;
                          c({
                              stream: "error",
                              reason: t
                          })
                      },
                      sinkCapability: u,
                      onPull: null,
                      onCancel: null,
                      isCancelled: false,
                      desiredSize: s,
                      ready: null
                  };
                  f.sinkCapability.resolve();
                  f.ready = f.sinkCapability.promise;
                  this.streamSinks[i] = f;
                  we(a[0], [t.data, f], a[1]).then(function() {
                      c({
                          stream: "start_complete",
                          success: true
                      })
                  }, function(e) {
                      c({
                          stream: "start_complete",
                          success: false,
                          reason: e
                      })
                  })
              },
              _processStreamMessage: function e(t) {
                  var r = this;
                  var n = this.sourceName;
                  var a = t.sourceName;
                  var i = t.streamId;
                  var s = function e(t) {
                      var s = t.stream
                        , o = t.success
                        , l = t.reason;
                      r.comObj.postMessage({
                          sourceName: n,
                          targetName: a,
                          stream: s,
                          success: o,
                          streamId: i,
                          reason: l
                      })
                  };
                  var o = function e() {
                      Promise.all([r.streamControllers[t.streamId].startCall, r.streamControllers[t.streamId].pullCall, r.streamControllers[t.streamId].cancelCall].map(function(e) {
                          return e && ke(e.promise)
                      })).then(function() {
                          delete r.streamControllers[t.streamId]
                      })
                  };
                  switch (t.stream) {
                  case "start_complete":
                      Ce(this.streamControllers[t.streamId].startCall, t.success, Pe(t.reason));
                      break;
                  case "pull_complete":
                      Ce(this.streamControllers[t.streamId].pullCall, t.success, Pe(t.reason));
                      break;
                  case "pull":
                      if (!this.streamSinks[t.streamId]) {
                          s({
                              stream: "pull_complete",
                              success: true
                          });
                          break
                      }
                      if (this.streamSinks[t.streamId].desiredSize <= 0 && t.desiredSize > 0) {
                          this.streamSinks[t.streamId].sinkCapability.resolve()
                      }
                      this.streamSinks[t.streamId].desiredSize = t.desiredSize;
                      we(this.streamSinks[t.streamId].onPull).then(function() {
                          s({
                              stream: "pull_complete",
                              success: true
                          })
                      }, function(e) {
                          s({
                              stream: "pull_complete",
                              success: false,
                              reason: e
                          })
                      });
                      break;
                  case "enqueue":
                      k(this.streamControllers[t.streamId], "enqueue should have stream controller");
                      if (!this.streamControllers[t.streamId].isClosed) {
                          this.streamControllers[t.streamId].controller.enqueue(t.chunk)
                      }
                      break;
                  case "close":
                      k(this.streamControllers[t.streamId], "close should have stream controller");
                      if (this.streamControllers[t.streamId].isClosed) {
                          break
                      }
                      this.streamControllers[t.streamId].isClosed = true;
                      this.streamControllers[t.streamId].controller.close();
                      o();
                      break;
                  case "error":
                      k(this.streamControllers[t.streamId], "error should have stream controller");
                      this.streamControllers[t.streamId].controller.error(Pe(t.reason));
                      o();
                      break;
                  case "cancel_complete":
                      Ce(this.streamControllers[t.streamId].cancelCall, t.success, Pe(t.reason));
                      o();
                      break;
                  case "cancel":
                      if (!this.streamSinks[t.streamId]) {
                          break
                      }
                      we(this.streamSinks[t.streamId].onCancel, [Pe(t.reason)]).then(function() {
                          s({
                              stream: "cancel_complete",
                              success: true
                          })
                      }, function(e) {
                          s({
                              stream: "cancel_complete",
                              success: false,
                              reason: e
                          })
                      });
                      this.streamSinks[t.streamId].sinkCapability.reject(Pe(t.reason));
                      this.streamSinks[t.streamId].isCancelled = true;
                      delete this.streamSinks[t.streamId];
                      break;
                  default:
                      throw new Error("Unexpected stream case")
                  }
              },
              postMessage: function e(t, r) {
                  if (r && this.postMessageTransfers) {
                      this.comObj.postMessage(t, r)
                  } else {
                      this.comObj.postMessage(t)
                  }
              },
              destroy: function e() {
                  this.comObj.removeEventListener("message", this._onComObjOnMessage)
              }
          };
          function xe(e, t, r) {
              var n = new Image;
              n.onload = function t() {
                  r.resolve(e, n)
              }
              ;
              n.onerror = function t() {
                  r.resolve(e, null);
                  w("Error during JPEG image loading")
              }
              ;
              n.src = t
          }
          t.FONT_IDENTITY_MATRIX = s;
          t.IDENTITY_MATRIX = ne;
          t.OPS = b;
          t.VERBOSITY_LEVELS = m;
          t.UNSUPPORTED_FEATURES = R;
          t.AnnotationBorderStyleType = h;
          t.AnnotationFieldFlag = d;
          t.AnnotationFlag = f;
          t.AnnotationType = c;
          t.FontType = v;
          t.ImageKind = u;
          t.CMapCompressionType = g;
          t.AbortException = z;
          t.InvalidPDFException = F;
          t.MessageHandler = Re;
          t.MissingDataException = U;
          t.MissingPDFException = N;
          t.NativeImageDecoding = o;
          t.NotImplementedException = q;
          t.PageViewport = ie;
          t.PasswordException = j;
          t.PasswordResponses = O;
          t.StatTimer = ye;
          t.StreamType = p;
          t.TextRenderingMode = l;
          t.UnexpectedResponseException = M;
          t.UnknownErrorException = D;
          t.Util = ae;
          t.XRefParseException = W;
          t.FormatError = B;
          t.arrayByteLength = V;
          t.arraysToBytes = J;
          t.assert = k;
          t.bytesToString = X;
          t.createBlob = Ae;
          t.createPromiseCapability = _e;
          t.createObjectURL = Se;
          t.deprecated = P;
          t.getLookupTableFactory = L;
          t.getVerbosityLevel = A;
          t.globalScope = i;
          t.info = S;
          t.isArray = ve;
          t.isArrayBuffer = me;
          t.isBool = fe;
          t.isEmptyObj = ce;
          t.isInt = de;
          t.isNum = he;
          t.isString = pe;
          t.isSpace = ge;
          t.isNodeJS = be;
          t.isSameOrigin = x;
          t.createValidAbsoluteUrl = E;
          t.isLittleEndian = te;
          t.isEvalSupported = re;
          t.loadJpegStream = xe;
          t.log2 = K;
          t.readInt8 = Z;
          t.readUint16 = $;
          t.readUint32 = ee;
          t.removeNullCharacters = H;
          t.ReadableStream = a.ReadableStream;
          t.setVerbosityLevel = y;
          t.shadow = I;
          t.string32 = Q;
          t.stringToBytes = Y;
          t.stringToPDFString = oe;
          t.stringToUTF8String = le;
          t.utf8StringToString = ue;
          t.warn = w;
          t.unreachable = C
      }
      , function(e, t, r) {
          "use strict";
          Object.defineProperty(t, "__esModule", {
              value: true
          });
          t.DOMCMapReaderFactory = t.DOMCanvasFactory = t.DEFAULT_LINK_REL = t.getDefaultSetting = t.LinkTarget = t.getFilenameFromUrl = t.isValidUrl = t.isExternalLinkTargetSet = t.addLinkAttributes = t.RenderingCancelledException = t.CustomStyle = undefined;
          var n = function() {
              function e(e, t) {
                  for (var r = 0; r < t.length; r++) {
                      var n = t[r];
                      n.enumerable = n.enumerable || false;
                      n.configurable = true;
                      if ("value"in n)
                          n.writable = true;
                      Object.defineProperty(e, n.key, n)
                  }
              }
              return function(t, r, n) {
                  if (r)
                      e(t.prototype, r);
                  if (n)
                      e(t, n);
                  return t
              }
          }();
          var a = r(0);
          function i(e, t) {
              if (!(e instanceof t)) {
                  throw new TypeError("Cannot call a class as a function")
              }
          }
          var s = "noopener noreferrer nofollow";
          var o = function() {
              function e() {
                  i(this, e)
              }
              n(e, [{
                  key: "create",
                  value: function e(t, r) {
                      if (t <= 0 || r <= 0) {
                          throw new Error("invalid canvas size")
                      }
                      var n = document.createElement("canvas");
                      var a = n.getContext("2d");
                      n.width = t;
                      n.height = r;
                      return {
                          canvas: n,
                          context: a
                      }
                  }
              }, {
                  key: "reset",
                  value: function e(t, r, n) {
                      if (!t.canvas) {
                          throw new Error("canvas is not specified")
                      }
                      if (r <= 0 || n <= 0) {
                          throw new Error("invalid canvas size")
                      }
                      t.canvas.width = r;
                      t.canvas.height = n
                  }
              }, {
                  key: "destroy",
                  value: function e(t) {
                      if (!t.canvas) {
                          throw new Error("canvas is not specified")
                      }
                      t.canvas.width = 0;
                      t.canvas.height = 0;
                      t.canvas = null;
                      t.context = null
                  }
              }]);
              return e
          }();
          var l = function() {
              function e(t) {
                  var r = t.baseUrl
                    , n = r === undefined ? null : r
                    , a = t.isCompressed
                    , s = a === undefined ? false : a;
                  i(this, e);
                  this.baseUrl = n;
                  this.isCompressed = s
              }
              n(e, [{
                  key: "fetch",
                  value: function e(t) {
                      var r = this;
                      var n = t.name;
                      if (!n) {
                          return Promise.reject(new Error("CMap name must be specified."))
                      }
                      return new Promise(function(e, t) {
                          var i = r.baseUrl + n + (r.isCompressed ? ".bcmap" : "");
                          var s = new XMLHttpRequest;
                          s.open("GET", i, true);
                          if (r.isCompressed) {
                              s.responseType = "arraybuffer"
                          }
                          s.onreadystatechange = function() {
                              if (s.readyState !== XMLHttpRequest.DONE) {
                                  return
                              }
                              if (s.status === 200 || s.status === 0) {
                                  var n = void 0;
                                  if (r.isCompressed && s.response) {
                                      n = new Uint8Array(s.response)
                                  } else if (!r.isCompressed && s.responseText) {
                                      n = (0,
                                      a.stringToBytes)(s.responseText)
                                  }
                                  if (n) {
                                      e({
                                          cMapData: n,
                                          compressionType: r.isCompressed ? a.CMapCompressionType.BINARY : a.CMapCompressionType.NONE
                                      });
                                      return
                                  }
                              }
                              t(new Error("Unable to load " + (r.isCompressed ? "binary " : "") + "CMap at: " + i))
                          }
                          ;
                          s.send(null)
                      }
                      )
                  }
              }]);
              return e
          }();
          var u = function e() {
              var t = ["ms", "Moz", "Webkit", "O"];
              var r = Object.create(null);
              function n() {}
              n.getProp = function e(n, a) {
                  if (arguments.length === 1 && typeof r[n] === "string") {
                      return r[n]
                  }
                  a = a || document.documentElement;
                  var i = a.style, s, o;
                  if (typeof i[n] === "string") {
                      return r[n] = n
                  }
                  o = n.charAt(0).toUpperCase() + n.slice(1);
                  for (var l = 0, u = t.length; l < u; l++) {
                      s = t[l] + o;
                      if (typeof i[s] === "string") {
                          return r[n] = s
                      }
                  }
                  return r[n] = "undefined"
              }
              ;
              n.setProp = function e(t, r, n) {
                  var a = this.getProp(t);
                  if (a !== "undefined") {
                      r.style[a] = n
                  }
              }
              ;
              return n
          }();
          var c = function e() {
              function e(e, t) {
                  this.message = e;
                  this.type = t
              }
              e.prototype = new Error;
              e.prototype.name = "RenderingCancelledException";
              e.constructor = e;
              return e
          }();
          var f = {
              NONE: 0,
              SELF: 1,
              BLANK: 2,
              PARENT: 3,
              TOP: 4
          };
          var d = ["", "_self", "_blank", "_parent", "_top"];
          function h(e, t) {
              var r = t && t.url;
              e.href = e.title = r ? (0,
              a.removeNullCharacters)(r) : "";
              if (r) {
                  var n = t.target;
                  if (typeof n === "undefined") {
                      n = v("externalLinkTarget")
                  }
                  e.target = d[n];
                  var i = t.rel;
                  if (typeof i === "undefined") {
                      i = v("externalLinkRel")
                  }
                  e.rel = i
              }
          }
          function p(e) {
              var t = e.indexOf("#");
              var r = e.indexOf("?");
              var n = Math.min(t > 0 ? t : e.length, r > 0 ? r : e.length);
              return e.substring(e.lastIndexOf("/", n) + 1, n)
          }
          function v(e) {
              var t = a.globalScope.PDFJS;
              switch (e) {
              case "pdfBug":
                  return t ? t.pdfBug : false;
              case "disableAutoFetch":
                  return t ? t.disableAutoFetch : false;
              case "disableStream":
                  return t ? t.disableStream : false;
              case "disableRange":
                  return t ? t.disableRange : false;
              case "disableFontFace":
                  return t ? t.disableFontFace : false;
              case "disableCreateObjectURL":
                  return t ? t.disableCreateObjectURL : false;
              case "disableWebGL":
                  return t ? t.disableWebGL : true;
              case "cMapUrl":
                  return t ? t.cMapUrl : null;
              case "cMapPacked":
                  return t ? t.cMapPacked : false;
              case "postMessageTransfers":
                  return t ? t.postMessageTransfers : true;
              case "workerPort":
                  return t ? t.workerPort : null;
              case "workerSrc":
                  return t ? t.workerSrc : null;
              case "disableWorker":
                  return t ? t.disableWorker : false;
              case "maxImageSize":
                  return t ? t.maxImageSize : -1;
              case "imageResourcesPath":
                  return t ? t.imageResourcesPath : "";
              case "isEvalSupported":
                  return t ? t.isEvalSupported : true;
              case "externalLinkTarget":
                  if (!t) {
                      return f.NONE
                  }
                  switch (t.externalLinkTarget) {
                  case f.NONE:
                  case f.SELF:
                  case f.BLANK:
                  case f.PARENT:
                  case f.TOP:
                      return t.externalLinkTarget
                  }
                  (0,
                  a.warn)("PDFJS.externalLinkTarget is invalid: " + t.externalLinkTarget);
                  t.externalLinkTarget = f.NONE;
                  return f.NONE;
              case "externalLinkRel":
                  return t ? t.externalLinkRel : s;
              case "enableStats":
                  return !!(t && t.enableStats);
              case "pdfjsNext":
                  return !!(t && t.pdfjsNext);
              default:
                  throw new Error("Unknown default setting: " + e)
              }
          }
          function m() {
              var e = v("externalLinkTarget");
              switch (e) {
              case f.NONE:
                  return false;
              case f.SELF:
              case f.BLANK:
              case f.PARENT:
              case f.TOP:
                  return true
              }
          }
          function g(e, t) {
              (0,
              a.deprecated)("isValidUrl(), please use createValidAbsoluteUrl() instead.");
              var r = t ? "http://example.com" : null;
              return (0,
              a.createValidAbsoluteUrl)(e, r) !== null
          }
          t.CustomStyle = u;
          t.RenderingCancelledException = c;
          t.addLinkAttributes = h;
          t.isExternalLinkTargetSet = m;
          t.isValidUrl = g;
          t.getFilenameFromUrl = p;
          t.LinkTarget = f;
          t.getDefaultSetting = v;
          t.DEFAULT_LINK_REL = s;
          t.DOMCanvasFactory = o;
          t.DOMCMapReaderFactory = l
      }
      , function(e, t, r) {
          "use strict";
          Object.defineProperty(t, "__esModule", {
              value: true
          });
          t.build = t.version = t._UnsupportedManager = t.setPDFNetworkStreamClass = t.PDFPageProxy = t.PDFDocumentProxy = t.PDFWorker = t.PDFDataRangeTransport = t.LoopbackPort = t.getDocument = undefined;
          var n = function() {
              function e(e, t) {
                  for (var r = 0; r < t.length; r++) {
                      var n = t[r];
                      n.enumerable = n.enumerable || false;
                      n.configurable = true;
                      if ("value"in n)
                          n.writable = true;
                      Object.defineProperty(e, n.key, n)
                  }
              }
              return function(t, r, n) {
                  if (r)
                      e(t.prototype, r);
                  if (n)
                      e(t, n);
                  return t
              }
          }();
          var a = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(e) {
              return typeof e
          }
          : function(e) {
              return e && typeof Symbol === "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
          }
          ;
          var i = r(0);
          var s = r(1);
          var o = r(12);
          var l = r(11);
          var u = r(6);
          var c = r(14);
          function f(e, t) {
              if (!(e instanceof t)) {
                  throw new TypeError("Cannot call a class as a function")
              }
          }
          var d = 65536;
          var h = false;
          var p;
          var v = false;
          var m = typeof document !== "undefined" && document.currentScript ? document.currentScript.src : null;
          var g = null;
          var b = false;
          {
              if (typeof window === "undefined") {
                  h = true;
                  if (typeof require.ensure === "undefined") {
                      require.ensure = require("node-ensure")
                  }
                  b = true
              } else if (typeof require !== "undefined" && typeof require.ensure === "function") {
                  b = true
              }
              if (typeof requirejs !== "undefined" && requirejs.toUrl) {
                  p = requirejs.toUrl("pdfjs-dist/build/pdf.worker.js")
              }
              var _ = typeof requirejs !== "undefined" && requirejs.load;
              g = b ? function(e) {
                  require.ensure([], function() {
                      var t;
                      t = require("./pdf.worker.js");
                      e(t.WorkerMessageHandler)
                  })
              }
              : _ ? function(e) {
                  requirejs(["pdfjs-dist/build/pdf.worker"], function(t) {
                      e(t.WorkerMessageHandler)
                  })
              }
              : null
          }
          var y;
          function A(e) {
              y = e
          }
          function S(e, t, r, n) {
              var o = new P;
              if (arguments.length > 1) {
                  (0,
                  i.deprecated)("getDocument is called with pdfDataRangeTransport, " + "passwordCallback or progressCallback argument")
              }
              if (t) {
                  if (!(t instanceof C)) {
                      t = Object.create(t);
                      t.length = e.length;
                      t.initialData = e.initialData;
                      if (!t.abort) {
                          t.abort = function() {}
                      }
                  }
                  e = Object.create(e);
                  e.range = t
              }
              o.onPassword = r || null;
              o.onProgress = n || null;
              var l;
              if (typeof e === "string") {
                  l = {
                      url: e
                  }
              } else if ((0,
              i.isArrayBuffer)(e)) {
                  l = {
                      data: e
                  }
              } else if (e instanceof C) {
                  l = {
                      range: e
                  }
              } else {
                  if ((typeof e === "undefined" ? "undefined" : a(e)) !== "object") {
                      throw new Error("Invalid parameter in getDocument, " + "need either Uint8Array, string or a parameter object")
                  }
                  if (!e.url && !e.data && !e.range) {
                      throw new Error("Invalid parameter object: need either .data, .range or .url")
                  }
                  l = e
              }
              var u = {};
              var f = null;
              var h = null;
              var p = s.DOMCMapReaderFactory;
              for (var v in l) {
                  if (v === "url" && typeof window !== "undefined") {
                      u[v] = new URL(l[v],window.location).href;
                      continue
                  } else if (v === "range") {
                      f = l[v];
                      continue
                  } else if (v === "worker") {
                      h = l[v];
                      continue
                  } else if (v === "data" && !(l[v]instanceof Uint8Array)) {
                      var m = l[v];
                      if (typeof m === "string") {
                          u[v] = (0,
                          i.stringToBytes)(m)
                      } else if ((typeof m === "undefined" ? "undefined" : a(m)) === "object" && m !== null && !isNaN(m.length)) {
                          u[v] = new Uint8Array(m)
                      } else if ((0,
                      i.isArrayBuffer)(m)) {
                          u[v] = new Uint8Array(m)
                      } else {
                          throw new Error("Invalid PDF binary data: either typed array, " + "string or array-like object is expected in the " + "data property.")
                      }
                      continue
                  } else if (v === "CMapReaderFactory") {
                      p = l[v];
                      continue
                  }
                  u[v] = l[v]
              }
              u.rangeChunkSize = u.rangeChunkSize || d;
              u.ignoreErrors = u.stopAtErrors !== true;
              if (u.disableNativeImageDecoder !== undefined) {
                  (0,
                  i.deprecated)("parameter disableNativeImageDecoder, " + "use nativeImageDecoderSupport instead")
              }
              u.nativeImageDecoderSupport = u.nativeImageDecoderSupport || (u.disableNativeImageDecoder === true ? i.NativeImageDecoding.NONE : i.NativeImageDecoding.DECODE);
              if (u.nativeImageDecoderSupport !== i.NativeImageDecoding.DECODE && u.nativeImageDecoderSupport !== i.NativeImageDecoding.NONE && u.nativeImageDecoderSupport !== i.NativeImageDecoding.DISPLAY) {
                  (0,
                  i.warn)("Invalid parameter nativeImageDecoderSupport: " + "need a state of enum {NativeImageDecoding}");
                  u.nativeImageDecoderSupport = i.NativeImageDecoding.DECODE
              }
              if (!h) {
                  var g = (0,
                  s.getDefaultSetting)("workerPort");
                  h = g ? T.fromPort(g) : new T;
                  o._worker = h
              }
              var b = o.docId;
              h.promise.then(function() {
                  if (o.destroyed) {
                      throw new Error("Loading aborted")
                  }
                  return w(h, u, f, b).then(function(e) {
                      if (o.destroyed) {
                          throw new Error("Loading aborted")
                      }
                      var t = void 0;
                      if (f) {
                          t = new c.PDFDataTransportStream(u,f)
                      } else if (!u.data) {
                          t = new y({
                              source: u,
                              disableRange: (0,
                              s.getDefaultSetting)("disableRange")
                          })
                      }
                      var r = new i.MessageHandler(b,e,h.port);
                      r.postMessageTransfers = h.postMessageTransfers;
                      var n = new E(r,o,t,p);
                      o._transport = n;
                      r.send("Ready", null)
                  })
              }).catch(o._capability.reject);
              return o
          }
          function w(e, t, r, n) {
              if (e.destroyed) {
                  return Promise.reject(new Error("Worker was destroyed"))
              }
              t.disableAutoFetch = (0,
              s.getDefaultSetting)("disableAutoFetch");
              t.disableStream = (0,
              s.getDefaultSetting)("disableStream");
              t.chunkedViewerLoading = !!r;
              if (r) {
                  t.length = r.length;
                  t.initialData = r.initialData
              }
              return e.messageHandler.sendWithPromise("GetDocRequest", {
                  docId: n,
                  source: {
                      data: t.data,
                      url: t.url,
                      password: t.password,
                      disableAutoFetch: t.disableAutoFetch,
                      rangeChunkSize: t.rangeChunkSize,
                      length: t.length
                  },
                  maxImageSize: (0,
                  s.getDefaultSetting)("maxImageSize"),
                  disableFontFace: (0,
                  s.getDefaultSetting)("disableFontFace"),
                  disableCreateObjectURL: (0,
                  s.getDefaultSetting)("disableCreateObjectURL"),
                  postMessageTransfers: (0,
                  s.getDefaultSetting)("postMessageTransfers") && !v,
                  docBaseUrl: t.docBaseUrl,
                  nativeImageDecoderSupport: t.nativeImageDecoderSupport,
                  ignoreErrors: t.ignoreErrors
              }).then(function(t) {
                  if (e.destroyed) {
                      throw new Error("Worker was destroyed")
                  }
                  return t
              })
          }
          var P = function e() {
              var t = 0;
              function r() {
                  this._capability = (0,
                  i.createPromiseCapability)();
                  this._transport = null;
                  this._worker = null;
                  this.docId = "d" + t++;
                  this.destroyed = false;
                  this.onPassword = null;
                  this.onProgress = null;
                  this.onUnsupportedFeature = null
              }
              r.prototype = {
                  get promise() {
                      return this._capability.promise
                  },
                  destroy: function e() {
                      var t = this;
                      this.destroyed = true;
                      var r = !this._transport ? Promise.resolve() : this._transport.destroy();
                      return r.then(function() {
                          t._transport = null;
                          if (t._worker) {
                              t._worker.destroy();
                              t._worker = null
                          }
                      })
                  },
                  then: function e(t, r) {
                      return this.promise.then.apply(this.promise, arguments)
                  }
              };
              return r
          }();
          var C = function e() {
              function t(e, t) {
                  this.length = e;
                  this.initialData = t;
                  this._rangeListeners = [];
                  this._progressListeners = [];
                  this._progressiveReadListeners = [];
                  this._readyCapability = (0,
                  i.createPromiseCapability)()
              }
              t.prototype = {
                  addRangeListener: function e(t) {
                      this._rangeListeners.push(t)
                  },
                  addProgressListener: function e(t) {
                      this._progressListeners.push(t)
                  },
                  addProgressiveReadListener: function e(t) {
                      this._progressiveReadListeners.push(t)
                  },
                  onDataRange: function e(t, r) {
                      var n = this._rangeListeners;
                      for (var a = 0, i = n.length; a < i; ++a) {
                          n[a](t, r)
                      }
                  },
                  onDataProgress: function e(t) {
                      var r = this;
                      this._readyCapability.promise.then(function() {
                          var e = r._progressListeners;
                          for (var n = 0, a = e.length; n < a; ++n) {
                              e[n](t)
                          }
                      })
                  },
                  onDataProgressiveRead: function e(t) {
                      var r = this;
                      this._readyCapability.promise.then(function() {
                          var e = r._progressiveReadListeners;
                          for (var n = 0, a = e.length; n < a; ++n) {
                              e[n](t)
                          }
                      })
                  },
                  transportReady: function e() {
                      this._readyCapability.resolve()
                  },
                  requestDataRange: function e(t, r) {
                      throw new Error("Abstract method PDFDataRangeTransport.requestDataRange")
                  },
                  abort: function e() {}
              };
              return t
          }();
          var k = function e() {
              function t(e, t, r) {
                  this.pdfInfo = e;
                  this.transport = t;
                  this.loadingTask = r
              }
              t.prototype = {
                  get numPages() {
                      return this.pdfInfo.numPages
                  },
                  get fingerprint() {
                      return this.pdfInfo.fingerprint
                  },
                  getPage: function e(t) {
                      return this.transport.getPage(t)
                  },
                  getPageIndex: function e(t) {
                      return this.transport.getPageIndex(t)
                  },
                  getDestinations: function e() {
                      return this.transport.getDestinations()
                  },
                  getDestination: function e(t) {
                      return this.transport.getDestination(t)
                  },
                  getPageLabels: function e() {
                      return this.transport.getPageLabels()
                  },
                  getPageMode: function e() {
                      return this.transport.getPageMode()
                  },
                  getAttachments: function e() {
                      return this.transport.getAttachments()
                  },
                  getJavaScript: function e() {
                      return this.transport.getJavaScript()
                  },
                  getOutline: function e() {
                      return this.transport.getOutline()
                  },
                  getMetadata: function e() {
                      return this.transport.getMetadata()
                  },
                  getData: function e() {
                      return this.transport.getData()
                  },
                  getDownloadInfo: function e() {
                      return this.transport.downloadInfoCapability.promise
                  },
                  getStats: function e() {
                      return this.transport.getStats()
                  },
                  cleanup: function e() {
                      this.transport.startCleanup()
                  },
                  destroy: function e() {
                      return this.loadingTask.destroy()
                  }
              };
              return t
          }();
          var R = function e() {
              function t(e, t, r) {
                  this.pageIndex = e;
                  this.pageInfo = t;
                  this.transport = r;
                  this.stats = new i.StatTimer;
                  this.stats.enabled = (0,
                  s.getDefaultSetting)("enableStats");
                  this.commonObjs = r.commonObjs;
                  this.objs = new I;
                  this.cleanupAfterRender = false;
                  this.pendingCleanup = false;
                  this.intentStates = Object.create(null);
                  this.destroyed = false
              }
              t.prototype = {
                  get pageNumber() {
                      return this.pageIndex + 1
                  },
                  get rotate() {
                      return this.pageInfo.rotate
                  },
                  get ref() {
                      return this.pageInfo.ref
                  },
                  get userUnit() {
                      return this.pageInfo.userUnit
                  },
                  get view() {
                      return this.pageInfo.view
                  },
                  getViewport: function e(t, r) {
                      if (arguments.length < 2) {
                          r = this.rotate
                      }
                      return new i.PageViewport(this.view,t,r,0,0)
                  },
                  getAnnotations: function e(t) {
                      var r = t && t.intent || null;
                      if (!this.annotationsPromise || this.annotationsIntent !== r) {
                          this.annotationsPromise = this.transport.getAnnotations(this.pageIndex, r);
                          this.annotationsIntent = r
                      }
                      return this.annotationsPromise
                  },
                  render: function e(t) {
                      var r = this;
                      var n = this.stats;
                      n.time("Overall");
                      this.pendingCleanup = false;
                      var a = t.intent === "print" ? "print" : "display";
                      var o = t.canvasFactory || new s.DOMCanvasFactory;
                      if (!this.intentStates[a]) {
                          this.intentStates[a] = Object.create(null)
                      }
                      var l = this.intentStates[a];
                      if (!l.displayReadyCapability) {
                          l.receivingOperatorList = true;
                          l.displayReadyCapability = (0,
                          i.createPromiseCapability)();
                          l.operatorList = {
                              fnArray: [],
                              argsArray: [],
                              lastChunk: false
                          };
                          this.stats.time("Page Request");
                          this.transport.messageHandler.send("RenderPageRequest", {
                              pageIndex: this.pageNumber - 1,
                              intent: a,
                              renderInteractiveForms: t.renderInteractiveForms === true
                          })
                      }
                      var u = function e(t) {
                          var a = l.renderTasks.indexOf(c);
                          if (a >= 0) {
                              l.renderTasks.splice(a, 1)
                          }
                          if (r.cleanupAfterRender) {
                              r.pendingCleanup = true
                          }
                          r._tryCleanup();
                          if (t) {
                              c.capability.reject(t)
                          } else {
                              c.capability.resolve()
                          }
                          n.timeEnd("Rendering");
                          n.timeEnd("Overall")
                      };
                      var c = new O(u,t,this.objs,this.commonObjs,l.operatorList,this.pageNumber,o);
                      c.useRequestAnimationFrame = a !== "print";
                      if (!l.renderTasks) {
                          l.renderTasks = []
                      }
                      l.renderTasks.push(c);
                      var f = c.task;
                      if (t.continueCallback) {
                          (0,
                          i.deprecated)("render is used with continueCallback parameter");
                          f.onContinue = t.continueCallback
                      }
                      l.displayReadyCapability.promise.then(function(e) {
                          if (r.pendingCleanup) {
                              u();
                              return
                          }
                          n.time("Rendering");
                          c.initializeGraphics(e);
                          c.operatorListChanged()
                      }).catch(u);
                      return f
                  },
                  getOperatorList: function e() {
                      function t() {
                          if (n.operatorList.lastChunk) {
                              n.opListReadCapability.resolve(n.operatorList);
                              var e = n.renderTasks.indexOf(a);
                              if (e >= 0) {
                                  n.renderTasks.splice(e, 1)
                              }
                          }
                      }
                      var r = "oplist";
                      if (!this.intentStates[r]) {
                          this.intentStates[r] = Object.create(null)
                      }
                      var n = this.intentStates[r];
                      var a;
                      if (!n.opListReadCapability) {
                          a = {};
                          a.operatorListChanged = t;
                          n.receivingOperatorList = true;
                          n.opListReadCapability = (0,
                          i.createPromiseCapability)();
                          n.renderTasks = [];
                          n.renderTasks.push(a);
                          n.operatorList = {
                              fnArray: [],
                              argsArray: [],
                              lastChunk: false
                          };
                          this.transport.messageHandler.send("RenderPageRequest", {
                              pageIndex: this.pageIndex,
                              intent: r
                          })
                      }
                      return n.opListReadCapability.promise
                  },
                  streamTextContent: function e() {
                      var t = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
                      var r = 100;
                      return this.transport.messageHandler.sendWithStream("GetTextContent", {
                          pageIndex: this.pageNumber - 1,
                          normalizeWhitespace: t.normalizeWhitespace === true,
                          combineTextItems: t.disableCombineTextItems !== true
                      }, {
                          highWaterMark: r,
                          size: function e(t) {
                              return t.items.length
                          }
                      })
                  },
                  getTextContent: function e(t) {
                      t = t || {};
                      var r = this.streamTextContent(t);
                      return new Promise(function(e, t) {
                          function n() {
                              a.read().then(function(t) {
                                  var r = t.value
                                    , a = t.done;
                                  if (a) {
                                      e(s);
                                      return
                                  }
                                  i.Util.extendObj(s.styles, r.styles);
                                  i.Util.appendToArray(s.items, r.items);
                                  n()
                              }, t)
                          }
                          var a = r.getReader();
                          var s = {
                              items: [],
                              styles: Object.create(null)
                          };
                          n()
                      }
                      )
                  },
                  _destroy: function e() {
                      this.destroyed = true;
                      this.transport.pageCache[this.pageIndex] = null;
                      var t = [];
                      Object.keys(this.intentStates).forEach(function(e) {
                          if (e === "oplist") {
                              return
                          }
                          var r = this.intentStates[e];
                          r.renderTasks.forEach(function(e) {
                              var r = e.capability.promise.catch(function() {});
                              t.push(r);
                              e.cancel()
                          })
                      }, this);
                      this.objs.clear();
                      this.annotationsPromise = null;
                      this.pendingCleanup = false;
                      return Promise.all(t)
                  },
                  destroy: function e() {
                      (0,
                      i.deprecated)("page destroy method, use cleanup() instead");
                      this.cleanup()
                  },
                  cleanup: function e() {
                      this.pendingCleanup = true;
                      this._tryCleanup()
                  },
                  _tryCleanup: function e() {
                      if (!this.pendingCleanup || Object.keys(this.intentStates).some(function(e) {
                          var t = this.intentStates[e];
                          return t.renderTasks.length !== 0 || t.receivingOperatorList
                      }, this)) {
                          return
                      }
                      Object.keys(this.intentStates).forEach(function(e) {
                          delete this.intentStates[e]
                      }, this);
                      this.objs.clear();
                      this.annotationsPromise = null;
                      this.pendingCleanup = false
                  },
                  _startRenderPage: function e(t, r) {
                      var n = this.intentStates[r];
                      if (n.displayReadyCapability) {
                          n.displayReadyCapability.resolve(t)
                      }
                  },
                  _renderPageChunk: function e(t, r) {
                      var n = this.intentStates[r];
                      var a, i;
                      for (a = 0,
                      i = t.length; a < i; a++) {
                          n.operatorList.fnArray.push(t.fnArray[a]);
                          n.operatorList.argsArray.push(t.argsArray[a])
                      }
                      n.operatorList.lastChunk = t.lastChunk;
                      for (a = 0; a < n.renderTasks.length; a++) {
                          n.renderTasks[a].operatorListChanged()
                      }
                      if (t.lastChunk) {
                          n.receivingOperatorList = false;
                          this._tryCleanup()
                      }
                  }
              };
              return t
          }();
          var x = function() {
              function e(t) {
                  f(this, e);
                  this._listeners = [];
                  this._defer = t;
                  this._deferred = Promise.resolve(undefined)
              }
              n(e, [{
                  key: "postMessage",
                  value: function e(t, r) {
                      var n = this;
                      function s(e) {
                          if ((typeof e === "undefined" ? "undefined" : a(e)) !== "object" || e === null) {
                              return e
                          }
                          if (o.has(e)) {
                              return o.get(e)
                          }
                          var t;
                          var n;
                          if ((n = e.buffer) && (0,
                          i.isArrayBuffer)(n)) {
                              var l = r && r.indexOf(n) >= 0;
                              if (e === n) {
                                  t = e
                              } else if (l) {
                                  t = new e.constructor(n,e.byteOffset,e.byteLength)
                              } else {
                                  t = new e.constructor(e)
                              }
                              o.set(e, t);
                              return t
                          }
                          t = (0,
                          i.isArray)(e) ? [] : {};
                          o.set(e, t);
                          for (var u in e) {
                              var c, f = e;
                              while (!(c = Object.getOwnPropertyDescriptor(f, u))) {
                                  f = Object.getPrototypeOf(f)
                              }
                              if (typeof c.value === "undefined" || typeof c.value === "function") {
                                  continue
                              }
                              t[u] = s(c.value)
                          }
                          return t
                      }
                      if (!this._defer) {
                          this._listeners.forEach(function(e) {
                              e.call(this, {
                                  data: t
                              })
                          }, this);
                          return
                      }
                      var o = new WeakMap;
                      var l = {
                          data: s(t)
                      };
                      this._deferred.then(function() {
                          n._listeners.forEach(function(e) {
                              e.call(this, l)
                          }, n)
                      })
                  }
              }, {
                  key: "addEventListener",
                  value: function e(t, r) {
                      this._listeners.push(r)
                  }
              }, {
                  key: "removeEventListener",
                  value: function e(t, r) {
                      var n = this._listeners.indexOf(r);
                      this._listeners.splice(n, 1)
                  }
              }, {
                  key: "terminate",
                  value: function e() {
                      this._listeners = []
                  }
              }]);
              return e
          }();
          var T = function e() {
              var t = 0;
              function r() {
                  if (typeof p !== "undefined") {
                      return p
                  }
                  if ((0,
                  s.getDefaultSetting)("workerSrc")) {
                      return (0,
                      s.getDefaultSetting)("workerSrc")
                  }
                  if (m) {
                      return m.replace(/(\.(?:min\.)?js)(\?.*)?$/i, ".worker$1$2")
                  }
                  throw new Error("No PDFJS.workerSrc specified")
              }
              var n = void 0;
              function a() {
                  var e;
                  if (n) {
                      return n.promise
                  }
                  n = (0,
                  i.createPromiseCapability)();
                  var t = g || function(e) {
                      i.Util.loadScript(r(), function() {
                          e(window.pdfjsDistBuildPdfWorker.WorkerMessageHandler)
                      })
                  }
                  ;
                  t(n.resolve);
                  return n.promise
              }
              function o(e) {
                  var t = "importScripts('" + e + "');";
                  return URL.createObjectURL(new Blob([t]))
              }
              var l = new WeakMap;
              function u(e, t) {
                  if (t && l.has(t)) {
                      throw new Error("Cannot use more than one PDFWorker per port")
                  }
                  this.name = e;
                  this.destroyed = false;
                  this.postMessageTransfers = true;
                  this._readyCapability = (0,
                  i.createPromiseCapability)();
                  this._port = null;
                  this._webWorker = null;
                  this._messageHandler = null;
                  if (t) {
                      l.set(t, this);
                      this._initializeFromPort(t);
                      return
                  }
                  this._initialize()
              }
              u.prototype = {
                  get promise() {
                      return this._readyCapability.promise
                  },
                  get port() {
                      return this._port
                  },
                  get messageHandler() {
                      return this._messageHandler
                  },
                  _initializeFromPort: function e(t) {
                      this._port = t;
                      this._messageHandler = new i.MessageHandler("main","worker",t);
                      this._messageHandler.on("ready", function() {});
                      this._readyCapability.resolve()
                  },
                  _initialize: function e() {
                      var t = this;
                      if (!h && !(0,
                      s.getDefaultSetting)("disableWorker") && typeof Worker !== "undefined") {
                          var n = r();
                          try {
                              if (!(0,
                              i.isSameOrigin)(window.location.href, n)) {
                                  n = o(new URL(n,window.location).href)
                              }
                              var a = new Worker(n);
                              var l = new i.MessageHandler("main","worker",a);
                              var u = function e() {
                                  a.removeEventListener("error", c);
                                  l.destroy();
                                  a.terminate();
                                  if (t.destroyed) {
                                      t._readyCapability.reject(new Error("Worker was destroyed"))
                                  } else {
                                      t._setupFakeWorker()
                                  }
                              };
                              var c = function e() {
                                  if (!t._webWorker) {
                                      u()
                                  }
                              };
                              a.addEventListener("error", c);
                              l.on("test", function(e) {
                                  a.removeEventListener("error", c);
                                  if (t.destroyed) {
                                      u();
                                      return
                                  }
                                  var r = e && e.supportTypedArray;
                                  if (r) {
                                      t._messageHandler = l;
                                      t._port = a;
                                      t._webWorker = a;
                                      if (!e.supportTransfers) {
                                          t.postMessageTransfers = false;
                                          v = true
                                      }
                                      t._readyCapability.resolve();
                                      l.send("configure", {
                                          verbosity: (0,
                                          i.getVerbosityLevel)()
                                      })
                                  } else {
                                      t._setupFakeWorker();
                                      l.destroy();
                                      a.terminate()
                                  }
                              });
                              l.on("console_log", function(e) {
                                  console.log.apply(console, e)
                              });
                              l.on("console_error", function(e) {
                                  console.error.apply(console, e)
                              });
                              l.on("ready", function(e) {
                                  a.removeEventListener("error", c);
                                  if (t.destroyed) {
                                      u();
                                      return
                                  }
                                  try {
                                      f()
                                  } catch (e) {
                                      t._setupFakeWorker()
                                  }
                              });
                              var f = function e() {
                                  var t = (0,
                                  s.getDefaultSetting)("postMessageTransfers") && !v;
                                  var r = new Uint8Array([t ? 255 : 0]);
                                  try {
                                      l.send("test", r, [r.buffer])
                                  } catch (e) {
                                      (0,
                                      i.info)("Cannot use postMessage transfers");
                                      r[0] = 0;
                                      l.send("test", r)
                                  }
                              };
                              f();
                              return
                          } catch (e) {
                              (0,
                              i.info)("The worker has been disabled.")
                          }
                      }
                      this._setupFakeWorker()
                  },
                  _setupFakeWorker: function e() {
                      var r = this;
                      if (!h && !(0,
                      s.getDefaultSetting)("disableWorker")) {
                          (0,
                          i.warn)("Setting up fake worker.");
                          h = true
                      }
                      a().then(function(e) {
                          if (r.destroyed) {
                              r._readyCapability.reject(new Error("Worker was destroyed"));
                              return
                          }
                          var n = Uint8Array !== Float32Array;
                          var a = new x(n);
                          r._port = a;
                          var s = "fake" + t++;
                          var o = new i.MessageHandler(s + "_worker",s,a);
                          e.setup(o, a);
                          var l = new i.MessageHandler(s,s + "_worker",a);
                          r._messageHandler = l;
                          r._readyCapability.resolve()
                      })
                  },
                  destroy: function e() {
                      this.destroyed = true;
                      if (this._webWorker) {
                          this._webWorker.terminate();
                          this._webWorker = null
                      }
                      l.delete(this._port);
                      this._port = null;
                      if (this._messageHandler) {
                          this._messageHandler.destroy();
                          this._messageHandler = null
                      }
                  }
              };
              u.fromPort = function(e) {
                  if (l.has(e)) {
                      return l.get(e)
                  }
                  return new u(null,e)
              }
              ;
              return u
          }();
          var E = function e() {
              function t(e, t, r, n) {
                  this.messageHandler = e;
                  this.loadingTask = t;
                  this.commonObjs = new I;
                  this.fontLoader = new o.FontLoader(t.docId);
                  this.CMapReaderFactory = new n({
                      baseUrl: (0,
                      s.getDefaultSetting)("cMapUrl"),
                      isCompressed: (0,
                      s.getDefaultSetting)("cMapPacked")
                  });
                  this.destroyed = false;
                  this.destroyCapability = null;
                  this._passwordCapability = null;
                  this._networkStream = r;
                  this._fullReader = null;
                  this._lastProgress = null;
                  this.pageCache = [];
                  this.pagePromises = [];
                  this.downloadInfoCapability = (0,
                  i.createPromiseCapability)();
                  this.setupMessageHandler()
              }
              t.prototype = {
                  destroy: function e() {
                      var t = this;
                      if (this.destroyCapability) {
                          return this.destroyCapability.promise
                      }
                      this.destroyed = true;
                      this.destroyCapability = (0,
                      i.createPromiseCapability)();
                      if (this._passwordCapability) {
                          this._passwordCapability.reject(new Error("Worker was destroyed during onPassword callback"))
                      }
                      var r = [];
                      this.pageCache.forEach(function(e) {
                          if (e) {
                              r.push(e._destroy())
                          }
                      });
                      this.pageCache = [];
                      this.pagePromises = [];
                      var n = this.messageHandler.sendWithPromise("Terminate", null);
                      r.push(n);
                      Promise.all(r).then(function() {
                          t.fontLoader.clear();
                          if (t._networkStream) {
                              t._networkStream.cancelAllRequests()
                          }
                          if (t.messageHandler) {
                              t.messageHandler.destroy();
                              t.messageHandler = null
                          }
                          t.destroyCapability.resolve()
                      }, this.destroyCapability.reject);
                      return this.destroyCapability.promise
                  },
                  setupMessageHandler: function e() {
                      var t = this.messageHandler;
                      var r = this.loadingTask;
                      t.on("GetReader", function(e, t) {
                          var r = this;
                          (0,
                          i.assert)(this._networkStream);
                          this._fullReader = this._networkStream.getFullReader();
                          this._fullReader.onProgress = function(e) {
                              r._lastProgress = {
                                  loaded: e.loaded,
                                  total: e.total
                              }
                          }
                          ;
                          t.onPull = function() {
                              r._fullReader.read().then(function(e) {
                                  var r = e.value
                                    , n = e.done;
                                  if (n) {
                                      t.close();
                                      return
                                  }
                                  (0,
                                  i.assert)((0,
                                  i.isArrayBuffer)(r));
                                  t.enqueue(new Uint8Array(r), 1, [r])
                              }).catch(function(e) {
                                  t.error(e)
                              })
                          }
                          ;
                          t.onCancel = function(e) {
                              r._fullReader.cancel(e)
                          }
                      }, this);
                      t.on("ReaderHeadersReady", function(e) {
                          var t = this;
                          var r = (0,
                          i.createPromiseCapability)();
                          var n = this._fullReader;
                          n.headersReady.then(function() {
                              if (!n.isStreamingSupported || !n.isRangeSupported) {
                                  if (t._lastProgress) {
                                      var e = t.loadingTask;
                                      if (e.onProgress) {
                                          e.onProgress(t._lastProgress)
                                      }
                                  }
                                  n.onProgress = function(e) {
                                      var r = t.loadingTask;
                                      if (r.onProgress) {
                                          r.onProgress({
                                              loaded: e.loaded,
                                              total: e.total
                                          })
                                      }
                                  }
                              }
                              r.resolve({
                                  isStreamingSupported: n.isStreamingSupported,
                                  isRangeSupported: n.isRangeSupported,
                                  contentLength: n.contentLength
                              })
                          }, r.reject);
                          return r.promise
                      }, this);
                      t.on("GetRangeReader", function(e, t) {
                          (0,
                          i.assert)(this._networkStream);
                          var r = this._networkStream.getRangeReader(e.begin, e.end);
                          t.onPull = function() {
                              r.read().then(function(e) {
                                  var r = e.value
                                    , n = e.done;
                                  if (n) {
                                      t.close();
                                      return
                                  }
                                  (0,
                                  i.assert)((0,
                                  i.isArrayBuffer)(r));
                                  t.enqueue(new Uint8Array(r), 1, [r])
                              }).catch(function(e) {
                                  t.error(e)
                              })
                          }
                          ;
                          t.onCancel = function(e) {
                              r.cancel(e)
                          }
                      }, this);
                      t.on("GetDoc", function e(t) {
                          var r = t.pdfInfo;
                          this.numPages = t.pdfInfo.numPages;
                          var n = this.loadingTask;
                          var a = new k(r,this,n);
                          this.pdfDocument = a;
                          n._capability.resolve(a)
                      }, this);
                      t.on("PasswordRequest", function e(t) {
                          var n = this;
                          this._passwordCapability = (0,
                          i.createPromiseCapability)();
                          if (r.onPassword) {
                              var a = function e(t) {
                                  n._passwordCapability.resolve({
                                      password: t
                                  })
                              };
                              r.onPassword(a, t.code)
                          } else {
                              this._passwordCapability.reject(new i.PasswordException(t.message,t.code))
                          }
                          return this._passwordCapability.promise
                      }, this);
                      t.on("PasswordException", function e(t) {
                          r._capability.reject(new i.PasswordException(t.message,t.code))
                      }, this);
                      t.on("InvalidPDF", function e(t) {
                          this.loadingTask._capability.reject(new i.InvalidPDFException(t.message))
                      }, this);
                      t.on("MissingPDF", function e(t) {
                          this.loadingTask._capability.reject(new i.MissingPDFException(t.message))
                      }, this);
                      t.on("UnexpectedResponse", function e(t) {
                          this.loadingTask._capability.reject(new i.UnexpectedResponseException(t.message,t.status))
                      }, this);
                      t.on("UnknownError", function e(t) {
                          this.loadingTask._capability.reject(new i.UnknownErrorException(t.message,t.details))
                      }, this);
                      t.on("DataLoaded", function e(t) {
                          this.downloadInfoCapability.resolve(t)
                      }, this);
                      t.on("PDFManagerReady", function e(t) {}, this);
                      t.on("StartRenderPage", function e(t) {
                          if (this.destroyed) {
                              return
                          }
                          var r = this.pageCache[t.pageIndex];
                          r.stats.timeEnd("Page Request");
                          r._startRenderPage(t.transparency, t.intent)
                      }, this);
                      t.on("RenderPageChunk", function e(t) {
                          if (this.destroyed) {
                              return
                          }
                          var r = this.pageCache[t.pageIndex];
                          r._renderPageChunk(t.operatorList, t.intent)
                      }, this);
                      t.on("commonobj", function e(t) {
                          var r = this;
                          if (this.destroyed) {
                              return
                          }
                          var n = t[0];
                          var a = t[1];
                          if (this.commonObjs.hasData(n)) {
                              return
                          }
                          switch (a) {
                          case "Font":
                              var l = t[2];
                              if ("error"in l) {
                                  var u = l.error;
                                  (0,
                                  i.warn)("Error during font loading: " + u);
                                  this.commonObjs.resolve(n, u);
                                  break
                              }
                              var c = null;
                              if ((0,
                              s.getDefaultSetting)("pdfBug") && i.globalScope.FontInspector && i.globalScope["FontInspector"].enabled) {
                                  c = {
                                      registerFont: function e(t, r) {
                                          i.globalScope["FontInspector"].fontAdded(t, r)
                                      }
                                  }
                              }
                              var f = new o.FontFaceObject(l,{
                                  isEvalSuported: (0,
                                  s.getDefaultSetting)("isEvalSupported"),
                                  disableFontFace: (0,
                                  s.getDefaultSetting)("disableFontFace"),
                                  fontRegistry: c
                              });
                              var d = function e(t) {
                                  r.commonObjs.resolve(n, f)
                              };
                              this.fontLoader.bind([f], d);
                              break;
                          case "FontPath":
                              this.commonObjs.resolve(n, t[2]);
                              break;
                          default:
                              throw new Error("Got unknown common object type " + a)
                          }
                      }, this);
                      t.on("obj", function e(t) {
                          if (this.destroyed) {
                              return
                          }
                          var r = t[0];
                          var n = t[1];
                          var a = t[2];
                          var s = this.pageCache[n];
                          var o;
                          if (s.objs.hasData(r)) {
                              return
                          }
                          switch (a) {
                          case "JpegStream":
                              o = t[3];
                              (0,
                              i.loadJpegStream)(r, o, s.objs);
                              break;
                          case "Image":
                              o = t[3];
                              s.objs.resolve(r, o);
                              var l = 8e6;
                              if (o && "data"in o && o.data.length > l) {
                                  s.cleanupAfterRender = true
                              }
                              break;
                          default:
                              throw new Error("Got unknown object type " + a)
                          }
                      }, this);
                      t.on("DocProgress", function e(t) {
                          if (this.destroyed) {
                              return
                          }
                          var r = this.loadingTask;
                          if (r.onProgress) {
                              r.onProgress({
                                  loaded: t.loaded,
                                  total: t.total
                              })
                          }
                      }, this);
                      t.on("PageError", function e(t) {
                          if (this.destroyed) {
                              return
                          }
                          var r = this.pageCache[t.pageNum - 1];
                          var n = r.intentStates[t.intent];
                          if (n.displayReadyCapability) {
                              n.displayReadyCapability.reject(t.error)
                          } else {
                              throw new Error(t.error)
                          }
                          if (n.operatorList) {
                              n.operatorList.lastChunk = true;
                              for (var a = 0; a < n.renderTasks.length; a++) {
                                  n.renderTasks[a].operatorListChanged()
                              }
                          }
                      }, this);
                      t.on("UnsupportedFeature", function e(t) {
                          if (this.destroyed) {
                              return
                          }
                          var r = t.featureId;
                          var n = this.loadingTask;
                          if (n.onUnsupportedFeature) {
                              n.onUnsupportedFeature(r)
                          }
                          j.notify(r)
                      }, this);
                      t.on("JpegDecode", function(e) {
                          if (this.destroyed) {
                              return Promise.reject(new Error("Worker was destroyed"))
                          }
                          if (typeof document === "undefined") {
                              return Promise.reject(new Error('"document" is not defined.'))
                          }
                          var t = e[0];
                          var r = e[1];
                          if (r !== 3 && r !== 1) {
                              return Promise.reject(new Error("Only 3 components or 1 component can be returned"))
                          }
                          return new Promise(function(e, n) {
                              var a = new Image;
                              a.onload = function() {
                                  var t = a.width;
                                  var n = a.height;
                                  var i = t * n;
                                  var s = i * 4;
                                  var o = new Uint8Array(i * r);
                                  var l = document.createElement("canvas");
                                  l.width = t;
                                  l.height = n;
                                  var u = l.getContext("2d");
                                  u.drawImage(a, 0, 0);
                                  var c = u.getImageData(0, 0, t, n).data;
                                  var f, d;
                                  if (r === 3) {
                                      for (f = 0,
                                      d = 0; f < s; f += 4,
                                      d += 3) {
                                          o[d] = c[f];
                                          o[d + 1] = c[f + 1];
                                          o[d + 2] = c[f + 2]
                                      }
                                  } else if (r === 1) {
                                      for (f = 0,
                                      d = 0; f < s; f += 4,
                                      d++) {
                                          o[d] = c[f]
                                      }
                                  }
                                  e({
                                      data: o,
                                      width: t,
                                      height: n
                                  })
                              }
                              ;
                              a.onerror = function() {
                                  n(new Error("JpegDecode failed to load image"))
                              }
                              ;
                              a.src = t
                          }
                          )
                      }, this);
                      t.on("FetchBuiltInCMap", function(e) {
                          if (this.destroyed) {
                              return Promise.reject(new Error("Worker was destroyed"))
                          }
                          return this.CMapReaderFactory.fetch({
                              name: e.name
                          })
                      }, this)
                  },
                  getData: function e() {
                      return this.messageHandler.sendWithPromise("GetData", null)
                  },
                  getPage: function e(t, r) {
                      var n = this;
                      if (!(0,
                      i.isInt)(t) || t <= 0 || t > this.numPages) {
                          return Promise.reject(new Error("Invalid page request"))
                      }
                      var a = t - 1;
                      if (a in this.pagePromises) {
                          return this.pagePromises[a]
                      }
                      var s = this.messageHandler.sendWithPromise("GetPage", {
                          pageIndex: a
                      }).then(function(e) {
                          if (n.destroyed) {
                              throw new Error("Transport destroyed")
                          }
                          var t = new R(a,e,n);
                          n.pageCache[a] = t;
                          return t
                      });
                      this.pagePromises[a] = s;
                      return s
                  },
                  getPageIndex: function e(t) {
                      return this.messageHandler.sendWithPromise("GetPageIndex", {
                          ref: t
                      }).catch(function(e) {
                          return Promise.reject(new Error(e))
                      })
                  },
                  getAnnotations: function e(t, r) {
                      return this.messageHandler.sendWithPromise("GetAnnotations", {
                          pageIndex: t,
                          intent: r
                      })
                  },
                  getDestinations: function e() {
                      return this.messageHandler.sendWithPromise("GetDestinations", null)
                  },
                  getDestination: function e(t) {
                      return this.messageHandler.sendWithPromise("GetDestination", {
                          id: t
                      })
                  },
                  getPageLabels: function e() {
                      return this.messageHandler.sendWithPromise("GetPageLabels", null)
                  },
                  getPageMode: function e() {
                      return this.messageHandler.sendWithPromise("GetPageMode", null)
                  },
                  getAttachments: function e() {
                      return this.messageHandler.sendWithPromise("GetAttachments", null)
                  },
                  getJavaScript: function e() {
                      return this.messageHandler.sendWithPromise("GetJavaScript", null)
                  },
                  getOutline: function e() {
                      return this.messageHandler.sendWithPromise("GetOutline", null)
                  },
                  getMetadata: function e() {
                      return this.messageHandler.sendWithPromise("GetMetadata", null).then(function e(t) {
                          return {
                              info: t[0],
                              metadata: t[1] ? new u.Metadata(t[1]) : null
                          }
                      })
                  },
                  getStats: function e() {
                      return this.messageHandler.sendWithPromise("GetStats", null)
                  },
                  startCleanup: function e() {
                      var t = this;
                      this.messageHandler.sendWithPromise("Cleanup", null).then(function() {
                          for (var e = 0, r = t.pageCache.length; e < r; e++) {
                              var n = t.pageCache[e];
                              if (n) {
                                  n.cleanup()
                              }
                          }
                          t.commonObjs.clear();
                          t.fontLoader.clear()
                      })
                  }
              };
              return t
          }();
          var I = function e() {
              function t() {
                  this.objs = Object.create(null)
              }
              t.prototype = {
                  ensureObj: function e(t) {
                      if (this.objs[t]) {
                          return this.objs[t]
                      }
                      var r = {
                          capability: (0,
                          i.createPromiseCapability)(),
                          data: null,
                          resolved: false
                      };
                      this.objs[t] = r;
                      return r
                  },
                  get: function e(t, r) {
                      if (r) {
                          this.ensureObj(t).capability.promise.then(r);
                          return null
                      }
                      var n = this.objs[t];
                      if (!n || !n.resolved) {
                          throw new Error("Requesting object that isn't resolved yet " + t)
                      }
                      return n.data
                  },
                  resolve: function e(t, r) {
                      var n = this.ensureObj(t);
                      n.resolved = true;
                      n.data = r;
                      n.capability.resolve(r)
                  },
                  isResolved: function e(t) {
                      var r = this.objs;
                      if (!r[t]) {
                          return false
                      }
                      return r[t].resolved
                  },
                  hasData: function e(t) {
                      return this.isResolved(t)
                  },
                  getData: function e(t) {
                      var r = this.objs;
                      if (!r[t] || !r[t].resolved) {
                          return null
                      }
                      return r[t].data
                  },
                  clear: function e() {
                      this.objs = Object.create(null)
                  }
              };
              return t
          }();
          var L = function e() {
              function t(e) {
                  this._internalRenderTask = e;
                  this.onContinue = null
              }
              t.prototype = {
                  get promise() {
                      return this._internalRenderTask.capability.promise
                  },
                  cancel: function e() {
                      this._internalRenderTask.cancel()
                  },
                  then: function e(t, r) {
                      return this.promise.then.apply(this.promise, arguments)
                  }
              };
              return t
          }();
          var O = function e() {
              var t = new WeakMap;
              function r(e, t, r, n, a, s, o) {
                  this.callback = e;
                  this.params = t;
                  this.objs = r;
                  this.commonObjs = n;
                  this.operatorListIdx = null;
                  this.operatorList = a;
                  this.pageNumber = s;
                  this.canvasFactory = o;
                  this.running = false;
                  this.graphicsReadyCallback = null;
                  this.graphicsReady = false;
                  this.useRequestAnimationFrame = false;
                  this.cancelled = false;
                  this.capability = (0,
                  i.createPromiseCapability)();
                  this.task = new L(this);
                  this._continueBound = this._continue.bind(this);
                  this._scheduleNextBound = this._scheduleNext.bind(this);
                  this._nextBound = this._next.bind(this);
                  this._canvas = t.canvasContext.canvas
              }
              r.prototype = {
                  initializeGraphics: function e(r) {
                      if (this._canvas) {
                          if (t.has(this._canvas)) {
                              throw new Error("Cannot use the same canvas during multiple render() operations. " + "Use different canvas or ensure previous operations were " + "cancelled or completed.")
                          }
                          t.set(this._canvas, this)
                      }
                      if (this.cancelled) {
                          return
                      }
                      if ((0,
                      s.getDefaultSetting)("pdfBug") && i.globalScope.StepperManager && i.globalScope.StepperManager.enabled) {
                          this.stepper = i.globalScope.StepperManager.create(this.pageNumber - 1);
                          this.stepper.init(this.operatorList);
                          this.stepper.nextBreakPoint = this.stepper.getNextBreakPoint()
                      }
                      var n = this.params;
                      this.gfx = new l.CanvasGraphics(n.canvasContext,this.commonObjs,this.objs,this.canvasFactory,n.imageLayer);
                      this.gfx.beginDrawing({
                          transform: n.transform,
                          viewport: n.viewport,
                          transparency: r,
                          background: n.background
                      });
                      this.operatorListIdx = 0;
                      this.graphicsReady = true;
                      if (this.graphicsReadyCallback) {
                          this.graphicsReadyCallback()
                      }
                  },
                  cancel: function e() {
                      this.running = false;
                      this.cancelled = true;
                      if (this._canvas) {
                          t.delete(this._canvas)
                      }
                      if ((0,
                      s.getDefaultSetting)("pdfjsNext")) {
                          this.callback(new s.RenderingCancelledException("Rendering cancelled, page " + this.pageNumber,"canvas"))
                      } else {
                          this.callback("cancelled")
                      }
                  },
                  operatorListChanged: function e() {
                      if (!this.graphicsReady) {
                          if (!this.graphicsReadyCallback) {
                              this.graphicsReadyCallback = this._continueBound
                          }
                          return
                      }
                      if (this.stepper) {
                          this.stepper.updateOperatorList(this.operatorList)
                      }
                      if (this.running) {
                          return
                      }
                      this._continue()
                  },
                  _continue: function e() {
                      this.running = true;
                      if (this.cancelled) {
                          return
                      }
                      if (this.task.onContinue) {
                          this.task.onContinue(this._scheduleNextBound)
                      } else {
                          this._scheduleNext()
                      }
                  },
                  _scheduleNext: function e() {
                      if (this.useRequestAnimationFrame && typeof window !== "undefined") {
                          window.requestAnimationFrame(this._nextBound)
                      } else {
                          Promise.resolve(undefined).then(this._nextBound)
                      }
                  },
                  _next: function e() {
                      if (this.cancelled) {
                          return
                      }
                      this.operatorListIdx = this.gfx.executeOperatorList(this.operatorList, this.operatorListIdx, this._continueBound, this.stepper);
                      if (this.operatorListIdx === this.operatorList.argsArray.length) {
                          this.running = false;
                          if (this.operatorList.lastChunk) {
                              this.gfx.endDrawing();
                              if (this._canvas) {
                                  t.delete(this._canvas)
                              }
                              this.callback()
                          }
                      }
                  }
              };
              return r
          }();
          var j = function e() {
              var t = [];
              return {
                  listen: function e(r) {
                      (0,
                      i.deprecated)("Global UnsupportedManager.listen is used: " + " use PDFDocumentLoadingTask.onUnsupportedFeature instead");
                      t.push(r)
                  },
                  notify: function e(r) {
                      for (var n = 0, a = t.length; n < a; n++) {
                          t[n](r)
                      }
                  }
              }
          }();
          var D, F;
          {
              t.version = D = "1.9.426";
              t.build = F = "2558a58d"
          }
          t.getDocument = S;
          t.LoopbackPort = x;
          t.PDFDataRangeTransport = C;
          t.PDFWorker = T;
          t.PDFDocumentProxy = k;
          t.PDFPageProxy = R;
          t.setPDFNetworkStreamClass = A;
          t._UnsupportedManager = j;
          t.version = D;
          t.build = F
      }
      , function(e, t, r) {
          "use strict";
          Object.defineProperty(t, "__esModule", {
              value: true
          });
          t.AnnotationLayer = undefined;
          var n = r(1);
          var a = r(0);
          function i() {}
          i.prototype = {
              create: function e(t) {
                  var r = t.data.annotationType;
                  switch (r) {
                  case a.AnnotationType.LINK:
                      return new o(t);
                  case a.AnnotationType.TEXT:
                      return new l(t);
                  case a.AnnotationType.WIDGET:
                      var n = t.data.fieldType;
                      switch (n) {
                      case "Tx":
                          return new c(t);
                      case "Btn":
                          if (t.data.radioButton) {
                              return new d(t)
                          } else if (t.data.checkBox) {
                              return new f(t)
                          }
                          (0,
                          a.warn)("Unimplemented button widget annotation: pushbutton");
                          break;
                      case "Ch":
                          return new h(t)
                      }
                      return new u(t);
                  case a.AnnotationType.POPUP:
                      return new p(t);
                  case a.AnnotationType.LINE:
                      return new m(t);
                  case a.AnnotationType.HIGHLIGHT:
                      return new g(t);
                  case a.AnnotationType.UNDERLINE:
                      return new b(t);
                  case a.AnnotationType.SQUIGGLY:
                      return new _(t);
                  case a.AnnotationType.STRIKEOUT:
                      return new y(t);
                  case a.AnnotationType.FILEATTACHMENT:
                      return new A(t);
                  default:
                      return new s(t)
                  }
              }
          };
          var s = function e() {
              function t(e, t, r) {
                  this.isRenderable = t || false;
                  this.data = e.data;
                  this.layer = e.layer;
                  this.page = e.page;
                  this.viewport = e.viewport;
                  this.linkService = e.linkService;
                  this.downloadManager = e.downloadManager;
                  this.imageResourcesPath = e.imageResourcesPath;
                  this.renderInteractiveForms = e.renderInteractiveForms;
                  if (t) {
                      this.container = this._createContainer(r)
                  }
              }
              t.prototype = {
                  _createContainer: function e(t) {
                      var r = this.data
                        , i = this.page
                        , s = this.viewport;
                      var o = document.createElement("section");
                      var l = r.rect[2] - r.rect[0];
                      var u = r.rect[3] - r.rect[1];
                      o.setAttribute("data-annotation-id", r.id);
                      var c = a.Util.normalizeRect([r.rect[0], i.view[3] - r.rect[1] + i.view[1], r.rect[2], i.view[3] - r.rect[3] + i.view[1]]);
                      n.CustomStyle.setProp("transform", o, "matrix(" + s.transform.join(",") + ")");
                      n.CustomStyle.setProp("transformOrigin", o, -c[0] + "px " + -c[1] + "px");
                      if (!t && r.borderStyle.width > 0) {
                          o.style.borderWidth = r.borderStyle.width + "px";
                          if (r.borderStyle.style !== a.AnnotationBorderStyleType.UNDERLINE) {
                              l = l - 2 * r.borderStyle.width;
                              u = u - 2 * r.borderStyle.width
                          }
                          var f = r.borderStyle.horizontalCornerRadius;
                          var d = r.borderStyle.verticalCornerRadius;
                          if (f > 0 || d > 0) {
                              var h = f + "px / " + d + "px";
                              n.CustomStyle.setProp("borderRadius", o, h)
                          }
                          switch (r.borderStyle.style) {
                          case a.AnnotationBorderStyleType.SOLID:
                              o.style.borderStyle = "solid";
                              break;
                          case a.AnnotationBorderStyleType.DASHED:
                              o.style.borderStyle = "dashed";
                              break;
                          case a.AnnotationBorderStyleType.BEVELED:
                              (0,
                              a.warn)("Unimplemented border style: beveled");
                              break;
                          case a.AnnotationBorderStyleType.INSET:
                              (0,
                              a.warn)("Unimplemented border style: inset");
                              break;
                          case a.AnnotationBorderStyleType.UNDERLINE:
                              o.style.borderBottomStyle = "solid";
                              break;
                          default:
                              break
                          }
                          if (r.color) {
                              o.style.borderColor = a.Util.makeCssRgb(r.color[0] | 0, r.color[1] | 0, r.color[2] | 0)
                          } else {
                              o.style.borderWidth = 0
                          }
                      }
                      o.style.left = c[0] + "px";
                      o.style.top = c[1] + "px";
                      o.style.width = l + "px";
                      o.style.height = u + "px";
                      return o
                  },
                  _createPopup: function e(t, r, n) {
                      if (!r) {
                          r = document.createElement("div");
                          r.style.height = t.style.height;
                          r.style.width = t.style.width;
                          t.appendChild(r)
                      }
                      var a = new v({
                          container: t,
                          trigger: r,
                          color: n.color,
                          title: n.title,
                          contents: n.contents,
                          hideWrapper: true
                      });
                      var i = a.render();
                      i.style.left = t.style.width;
                      t.appendChild(i)
                  },
                  render: function e() {
                      throw new Error("Abstract method AnnotationElement.render called")
                  }
              };
              return t
          }();
          var o = function e() {
              function t(e) {
                  s.call(this, e, true)
              }
              a.Util.inherit(t, s, {
                  render: function e() {
                      this.container.className = "linkAnnotation";
                      var t = document.createElement("a");
                      (0,
                      n.addLinkAttributes)(t, {
                          url: this.data.url,
                          target: this.data.newWindow ? n.LinkTarget.BLANK : undefined
                      });
                      if (!this.data.url) {
                          if (this.data.action) {
                              this._bindNamedAction(t, this.data.action)
                          } else {
                              this._bindLink(t, this.data.dest)
                          }
                      }
                      this.container.appendChild(t);
                      return this.container
                  },
                  _bindLink: function e(t, r) {
                      var n = this;
                      t.href = this.linkService.getDestinationHash(r);
                      t.onclick = function() {
                          if (r) {
                              n.linkService.navigateTo(r)
                          }
                          return false
                      }
                      ;
                      if (r) {
                          t.className = "internalLink"
                      }
                  },
                  _bindNamedAction: function e(t, r) {
                      var n = this;
                      t.href = this.linkService.getAnchorUrl("");
                      t.onclick = function() {
                          n.linkService.executeNamedAction(r);
                          return false
                      }
                      ;
                      t.className = "internalLink"
                  }
              });
              return t
          }();
          var l = function e() {
              function t(e) {
                  var t = !!(e.data.hasPopup || e.data.title || e.data.contents);
                  s.call(this, e, t)
              }
              a.Util.inherit(t, s, {
                  render: function e() {
                      this.container.className = "textAnnotation";
                      var t = document.createElement("img");
                      t.style.height = this.container.style.height;
                      t.style.width = this.container.style.width;
                      t.src = this.imageResourcesPath + "annotation-" + this.data.name.toLowerCase() + ".svg";
                      t.alt = "[{{type}} Annotation]";
                      t.dataset.l10nId = "text_annotation_type";
                      t.dataset.l10nArgs = JSON.stringify({
                          type: this.data.name
                      });
                      if (!this.data.hasPopup) {
                          this._createPopup(this.container, t, this.data)
                      }
                      this.container.appendChild(t);
                      return this.container
                  }
              });
              return t
          }();
          var u = function e() {
              function t(e, t) {
                  s.call(this, e, t)
              }
              a.Util.inherit(t, s, {
                  render: function e() {
                      return this.container
                  }
              });
              return t
          }();
          var c = function e() {
              var t = ["left", "center", "right"];
              function r(e) {
                  var t = e.renderInteractiveForms || !e.data.hasAppearance && !!e.data.fieldValue;
                  u.call(this, e, t)
              }
              a.Util.inherit(r, u, {
                  render: function e() {
                      this.container.className = "textWidgetAnnotation";
                      var r = null;
                      if (this.renderInteractiveForms) {
                          if (this.data.multiLine) {
                              r = document.createElement("textarea");
                              r.textContent = this.data.fieldValue
                          } else {
                              r = document.createElement("input");
                              r.type = "text";
                              r.setAttribute("value", this.data.fieldValue)
                          }
                          r.disabled = this.data.readOnly;
                          if (this.data.maxLen !== null) {
                              r.maxLength = this.data.maxLen
                          }
                          if (this.data.comb) {
                              var n = this.data.rect[2] - this.data.rect[0];
                              var a = n / this.data.maxLen;
                              r.classList.add("comb");
                              r.style.letterSpacing = "calc(" + a + "px - 1ch)"
                          }
                      } else {
                          r = document.createElement("div");
                          r.textContent = this.data.fieldValue;
                          r.style.verticalAlign = "middle";
                          r.style.display = "table-cell";
                          var i = null;
                          if (this.data.fontRefName) {
                              i = this.page.commonObjs.getData(this.data.fontRefName)
                          }
                          this._setTextStyle(r, i)
                      }
                      if (this.data.textAlignment !== null) {
                          r.style.textAlign = t[this.data.textAlignment]
                      }
                      this.container.appendChild(r);
                      return this.container
                  },
                  _setTextStyle: function e(t, r) {
                      var n = t.style;
                      n.fontSize = this.data.fontSize + "px";
                      n.direction = this.data.fontDirection < 0 ? "rtl" : "ltr";
                      if (!r) {
                          return
                      }
                      n.fontWeight = r.black ? r.bold ? "900" : "bold" : r.bold ? "bold" : "normal";
                      n.fontStyle = r.italic ? "italic" : "normal";
                      var a = r.loadedName ? '"' + r.loadedName + '", ' : "";
                      var i = r.fallbackName || "Helvetica, sans-serif";
                      n.fontFamily = a + i
                  }
              });
              return r
          }();
          var f = function e() {
              function t(e) {
                  u.call(this, e, e.renderInteractiveForms)
              }
              a.Util.inherit(t, u, {
                  render: function e() {
                      this.container.className = "buttonWidgetAnnotation checkBox";
                      var t = document.createElement("input");
                      t.disabled = this.data.readOnly;
                      t.type = "checkbox";
                      if (this.data.fieldValue && this.data.fieldValue !== "Off") {
                          t.setAttribute("checked", true)
                      }
                      this.container.appendChild(t);
                      return this.container
                  }
              });
              return t
          }();
          var d = function e() {
              function t(e) {
                  u.call(this, e, e.renderInteractiveForms)
              }
              a.Util.inherit(t, u, {
                  render: function e() {
                      this.container.className = "buttonWidgetAnnotation radioButton";
                      var t = document.createElement("input");
                      t.disabled = this.data.readOnly;
                      t.type = "radio";
                      t.name = this.data.fieldName;
                      if (this.data.fieldValue === this.data.buttonValue) {
                          t.setAttribute("checked", true)
                      }
                      this.container.appendChild(t);
                      return this.container
                  }
              });
              return t
          }();
          var h = function e() {
              function t(e) {
                  u.call(this, e, e.renderInteractiveForms)
              }
              a.Util.inherit(t, u, {
                  render: function e() {
                      this.container.className = "choiceWidgetAnnotation";
                      var t = document.createElement("select");
                      t.disabled = this.data.readOnly;
                      if (!this.data.combo) {
                          t.size = this.data.options.length;
                          if (this.data.multiSelect) {
                              t.multiple = true
                          }
                      }
                      for (var r = 0, n = this.data.options.length; r < n; r++) {
                          var a = this.data.options[r];
                          var i = document.createElement("option");
                          i.textContent = a.displayValue;
                          i.value = a.exportValue;
                          if (this.data.fieldValue.indexOf(a.displayValue) >= 0) {
                              i.setAttribute("selected", true)
                          }
                          t.appendChild(i)
                      }
                      this.container.appendChild(t);
                      return this.container
                  }
              });
              return t
          }();
          var p = function e() {
              var t = ["Line"];
              function r(e) {
                  var t = !!(e.data.title || e.data.contents);
                  s.call(this, e, t)
              }
              a.Util.inherit(r, s, {
                  render: function e() {
                      this.container.className = "popupAnnotation";
                      if (t.indexOf(this.data.parentType) >= 0) {
                          return this.container
                      }
                      var r = '[data-annotation-id="' + this.data.parentId + '"]';
                      var a = this.layer.querySelector(r);
                      if (!a) {
                          return this.container
                      }
                      var i = new v({
                          container: this.container,
                          trigger: a,
                          color: this.data.color,
                          title: this.data.title,
                          contents: this.data.contents
                      });
                      var s = parseFloat(a.style.left);
                      var o = parseFloat(a.style.width);
                      n.CustomStyle.setProp("transformOrigin", this.container, -(s + o) + "px -" + a.style.top);
                      this.container.style.left = s + o + "px";
                      this.container.appendChild(i.render());
                      return this.container
                  }
              });
              return r
          }();
          var v = function e() {
              var t = .7;
              function r(e) {
                  this.container = e.container;
                  this.trigger = e.trigger;
                  this.color = e.color;
                  this.title = e.title;
                  this.contents = e.contents;
                  this.hideWrapper = e.hideWrapper || false;
                  this.pinned = false
              }
              r.prototype = {
                  render: function e() {
                      var r = document.createElement("div");
                      r.className = "popupWrapper";
                      this.hideElement = this.hideWrapper ? r : this.container;
                      this.hideElement.setAttribute("hidden", true);
                      var n = document.createElement("div");
                      n.className = "popup";
                      var i = this.color;
                      if (i) {
                          var s = t * (255 - i[0]) + i[0];
                          var o = t * (255 - i[1]) + i[1];
                          var l = t * (255 - i[2]) + i[2];
                          n.style.backgroundColor = a.Util.makeCssRgb(s | 0, o | 0, l | 0)
                      }
                      var u = this._formatContents(this.contents);
                      var c = document.createElement("h1");
                      c.textContent = this.title;
                      this.trigger.addEventListener("click", this._toggle.bind(this));
                      this.trigger.addEventListener("mouseover", this._show.bind(this, false));
                      this.trigger.addEventListener("mouseout", this._hide.bind(this, false));
                      n.addEventListener("click", this._hide.bind(this, true));
                      n.appendChild(c);
                      n.appendChild(u);
                      r.appendChild(n);
                      return r
                  },
                  _formatContents: function e(t) {
                      var r = document.createElement("p");
                      var n = t.split(/(?:\r\n?|\n)/);
                      for (var a = 0, i = n.length; a < i; ++a) {
                          var s = n[a];
                          r.appendChild(document.createTextNode(s));
                          if (a < i - 1) {
                              r.appendChild(document.createElement("br"))
                          }
                      }
                      return r
                  },
                  _toggle: function e() {
                      if (this.pinned) {
                          this._hide(true)
                      } else {
                          this._show(true)
                      }
                  },
                  _show: function e(t) {
                      if (t) {
                          this.pinned = true
                      }
                      if (this.hideElement.hasAttribute("hidden")) {
                          this.hideElement.removeAttribute("hidden");
                          this.container.style.zIndex += 1
                      }
                  },
                  _hide: function e(t) {
                      if (t) {
                          this.pinned = false
                      }
                      if (!this.hideElement.hasAttribute("hidden") && !this.pinned) {
                          this.hideElement.setAttribute("hidden", true);
                          this.container.style.zIndex -= 1
                      }
                  }
              };
              return r
          }();
          var m = function e() {
              var t = "http://www.w3.org/2000/svg";
              function r(e) {
                  var t = !!(e.data.hasPopup || e.data.title || e.data.contents);
                  s.call(this, e, t, true)
              }
              a.Util.inherit(r, s, {
                  render: function e() {
                      this.container.className = "lineAnnotation";
                      var r = this.data;
                      var n = r.rect[2] - r.rect[0];
                      var a = r.rect[3] - r.rect[1];
                      var i = document.createElementNS(t, "svg:svg");
                      i.setAttributeNS(null, "version", "1.1");
                      i.setAttributeNS(null, "width", n + "px");
                      i.setAttributeNS(null, "height", a + "px");
                      i.setAttributeNS(null, "preserveAspectRatio", "none");
                      i.setAttributeNS(null, "viewBox", "0 0 " + n + " " + a);
                      var s = document.createElementNS(t, "svg:line");
                      s.setAttributeNS(null, "x1", r.rect[2] - r.lineCoordinates[0]);
                      s.setAttributeNS(null, "y1", r.rect[3] - r.lineCoordinates[1]);
                      s.setAttributeNS(null, "x2", r.rect[2] - r.lineCoordinates[2]);
                      s.setAttributeNS(null, "y2", r.rect[3] - r.lineCoordinates[3]);
                      s.setAttributeNS(null, "stroke-width", r.borderStyle.width);
                      s.setAttributeNS(null, "stroke", "transparent");
                      i.appendChild(s);
                      this.container.append(i);
                      this._createPopup(this.container, s, this.data);
                      return this.container
                  }
              });
              return r
          }();
          var g = function e() {
              function t(e) {
                  var t = !!(e.data.hasPopup || e.data.title || e.data.contents);
                  s.call(this, e, t, true)
              }
              a.Util.inherit(t, s, {
                  render: function e() {
                      this.container.className = "highlightAnnotation";
                      if (!this.data.hasPopup) {
                          this._createPopup(this.container, null, this.data)
                      }
                      return this.container
                  }
              });
              return t
          }();
          var b = function e() {
              function t(e) {
                  var t = !!(e.data.hasPopup || e.data.title || e.data.contents);
                  s.call(this, e, t, true)
              }
              a.Util.inherit(t, s, {
                  render: function e() {
                      this.container.className = "underlineAnnotation";
                      if (!this.data.hasPopup) {
                          this._createPopup(this.container, null, this.data)
                      }
                      return this.container
                  }
              });
              return t
          }();
          var _ = function e() {
              function t(e) {
                  var t = !!(e.data.hasPopup || e.data.title || e.data.contents);
                  s.call(this, e, t, true)
              }
              a.Util.inherit(t, s, {
                  render: function e() {
                      this.container.className = "squigglyAnnotation";
                      if (!this.data.hasPopup) {
                          this._createPopup(this.container, null, this.data)
                      }
                      return this.container
                  }
              });
              return t
          }();
          var y = function e() {
              function t(e) {
                  var t = !!(e.data.hasPopup || e.data.title || e.data.contents);
                  s.call(this, e, t, true)
              }
              a.Util.inherit(t, s, {
                  render: function e() {
                      this.container.className = "strikeoutAnnotation";
                      if (!this.data.hasPopup) {
                          this._createPopup(this.container, null, this.data)
                      }
                      return this.container
                  }
              });
              return t
          }();
          var A = function e() {
              function t(e) {
                  s.call(this, e, true);
                  var t = this.data.file;
                  this.filename = (0,
                  n.getFilenameFromUrl)(t.filename);
                  this.content = t.content;
                  this.linkService.onFileAttachmentAnnotation({
                      id: (0,
                      a.stringToPDFString)(t.filename),
                      filename: t.filename,
                      content: t.content
                  })
              }
              a.Util.inherit(t, s, {
                  render: function e() {
                      this.container.className = "fileAttachmentAnnotation";
                      var t = document.createElement("div");
                      t.style.height = this.container.style.height;
                      t.style.width = this.container.style.width;
                      t.addEventListener("dblclick", this._download.bind(this));
                      if (!this.data.hasPopup && (this.data.title || this.data.contents)) {
                          this._createPopup(this.container, t, this.data)
                      }
                      this.container.appendChild(t);
                      return this.container
                  },
                  _download: function e() {
                      if (!this.downloadManager) {
                          (0,
                          a.warn)("Download cannot be started due to unavailable download manager");
                          return
                      }
                      this.downloadManager.downloadData(this.content, this.filename, "")
                  }
              });
              return t
          }();
          var S = function e() {
              return {
                  render: function e(t) {
                      var r = new i;
                      for (var a = 0, s = t.annotations.length; a < s; a++) {
                          var o = t.annotations[a];
                          if (!o) {
                              continue
                          }
                          var l = r.create({
                              data: o,
                              layer: t.div,
                              page: t.page,
                              viewport: t.viewport,
                              linkService: t.linkService,
                              downloadManager: t.downloadManager,
                              imageResourcesPath: t.imageResourcesPath || (0,
                              n.getDefaultSetting)("imageResourcesPath"),
                              renderInteractiveForms: t.renderInteractiveForms || false
                          });
                          if (l.isRenderable) {
                              t.div.appendChild(l.render())
                          }
                      }
                  },
                  update: function e(t) {
                      for (var r = 0, a = t.annotations.length; r < a; r++) {
                          var i = t.annotations[r];
                          var s = t.div.querySelector('[data-annotation-id="' + i.id + '"]');
                          if (s) {
                              n.CustomStyle.setProp("transform", s, "matrix(" + t.viewport.transform.join(",") + ")")
                          }
                      }
                      t.div.removeAttribute("hidden")
                  }
              }
          }();
          t.AnnotationLayer = S
      }
      , function(e, t, r) {
          "use strict";
          Object.defineProperty(t, "__esModule", {
              value: true
          });
          t.SVGGraphics = undefined;
          var n = r(0);
          var a = function e() {
              throw new Error("Not implemented: SVGGraphics")
          };
          {
              var i = {
                  fontStyle: "normal",
                  fontWeight: "normal",
                  fillColor: "#000000"
              };
              var s = function e() {
                  var t = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
                  var r = 12;
                  var a = new Int32Array(256);
                  for (var i = 0; i < 256; i++) {
                      var s = i;
                      for (var o = 0; o < 8; o++) {
                          if (s & 1) {
                              s = 3988292384 ^ s >> 1 & 2147483647
                          } else {
                              s = s >> 1 & 2147483647
                          }
                      }
                      a[i] = s
                  }
                  function l(e, t, r) {
                      var n = -1;
                      for (var i = t; i < r; i++) {
                          var s = (n ^ e[i]) & 255;
                          var o = a[s];
                          n = n >>> 8 ^ o
                      }
                      return n ^ -1
                  }
                  function u(e, t, r, n) {
                      var a = n;
                      var i = t.length;
                      r[a] = i >> 24 & 255;
                      r[a + 1] = i >> 16 & 255;
                      r[a + 2] = i >> 8 & 255;
                      r[a + 3] = i & 255;
                      a += 4;
                      r[a] = e.charCodeAt(0) & 255;
                      r[a + 1] = e.charCodeAt(1) & 255;
                      r[a + 2] = e.charCodeAt(2) & 255;
                      r[a + 3] = e.charCodeAt(3) & 255;
                      a += 4;
                      r.set(t, a);
                      a += t.length;
                      var s = l(r, n + 4, a);
                      r[a] = s >> 24 & 255;
                      r[a + 1] = s >> 16 & 255;
                      r[a + 2] = s >> 8 & 255;
                      r[a + 3] = s & 255
                  }
                  function c(e, t, r) {
                      var n = 1;
                      var a = 0;
                      for (var i = t; i < r; ++i) {
                          n = (n + (e[i] & 255)) % 65521;
                          a = (a + n) % 65521
                      }
                      return a << 16 | n
                  }
                  function f(e) {
                      if (!(0,
                      n.isNodeJS)()) {
                          return d(e)
                      }
                      try {
                          var t;
                          if (parseInt(process.versions.node) >= 8) {
                              t = e
                          } else {
                              t = new Buffer(e)
                          }
                          var r = require("zlib").deflateSync(t, {
                              level: 9
                          });
                          return r instanceof Uint8Array ? r : new Uint8Array(r)
                      } catch (e) {
                          (0,
                          n.warn)("Not compressing PNG because zlib.deflateSync is unavailable: " + e)
                      }
                      return d(e)
                  }
                  function d(e) {
                      var t = e.length;
                      var r = 65535;
                      var n = Math.ceil(t / r);
                      var a = new Uint8Array(2 + t + n * 5 + 4);
                      var i = 0;
                      a[i++] = 120;
                      a[i++] = 156;
                      var s = 0;
                      while (t > r) {
                          a[i++] = 0;
                          a[i++] = 255;
                          a[i++] = 255;
                          a[i++] = 0;
                          a[i++] = 0;
                          a.set(e.subarray(s, s + r), i);
                          i += r;
                          s += r;
                          t -= r
                      }
                      a[i++] = 1;
                      a[i++] = t & 255;
                      a[i++] = t >> 8 & 255;
                      a[i++] = ~t & 65535 & 255;
                      a[i++] = (~t & 65535) >> 8 & 255;
                      a.set(e.subarray(s), i);
                      i += e.length - s;
                      var o = c(e, 0, e.length);
                      a[i++] = o >> 24 & 255;
                      a[i++] = o >> 16 & 255;
                      a[i++] = o >> 8 & 255;
                      a[i++] = o & 255;
                      return a
                  }
                  function h(e, a, i) {
                      var s = e.width;
                      var o = e.height;
                      var l, c, d;
                      var h = e.data;
                      switch (a) {
                      case n.ImageKind.GRAYSCALE_1BPP:
                          c = 0;
                          l = 1;
                          d = s + 7 >> 3;
                          break;
                      case n.ImageKind.RGB_24BPP:
                          c = 2;
                          l = 8;
                          d = s * 3;
                          break;
                      case n.ImageKind.RGBA_32BPP:
                          c = 6;
                          l = 8;
                          d = s * 4;
                          break;
                      default:
                          throw new Error("invalid format")
                      }
                      var p = new Uint8Array((1 + d) * o);
                      var v = 0
                        , m = 0;
                      var g, b;
                      for (g = 0; g < o; ++g) {
                          p[v++] = 0;
                          p.set(h.subarray(m, m + d), v);
                          m += d;
                          v += d
                      }
                      if (a === n.ImageKind.GRAYSCALE_1BPP) {
                          v = 0;
                          for (g = 0; g < o; g++) {
                              v++;
                              for (b = 0; b < d; b++) {
                                  p[v++] ^= 255
                              }
                          }
                      }
                      var _ = new Uint8Array([s >> 24 & 255, s >> 16 & 255, s >> 8 & 255, s & 255, o >> 24 & 255, o >> 16 & 255, o >> 8 & 255, o & 255, l, c, 0, 0, 0]);
                      var y = f(p);
                      var A = t.length + r * 3 + _.length + y.length;
                      var S = new Uint8Array(A);
                      var w = 0;
                      S.set(t, w);
                      w += t.length;
                      u("IHDR", _, S, w);
                      w += r + _.length;
                      u("IDATA", y, S, w);
                      w += r + y.length;
                      u("IEND", new Uint8Array(0), S, w);
                      return (0,
                      n.createObjectURL)(S, "image/png", i)
                  }
                  return function e(t, r) {
                      var a = t.kind === undefined ? n.ImageKind.GRAYSCALE_1BPP : t.kind;
                      return h(t, a, r)
                  }
              }();
              var o = function e() {
                  function t() {
                      this.fontSizeScale = 1;
                      this.fontWeight = i.fontWeight;
                      this.fontSize = 0;
                      this.textMatrix = n.IDENTITY_MATRIX;
                      this.fontMatrix = n.FONT_IDENTITY_MATRIX;
                      this.leading = 0;
                      this.x = 0;
                      this.y = 0;
                      this.lineX = 0;
                      this.lineY = 0;
                      this.charSpacing = 0;
                      this.wordSpacing = 0;
                      this.textHScale = 1;
                      this.textRise = 0;
                      this.fillColor = i.fillColor;
                      this.strokeColor = "#000000";
                      this.fillAlpha = 1;
                      this.strokeAlpha = 1;
                      this.lineWidth = 1;
                      this.lineJoin = "";
                      this.lineCap = "";
                      this.miterLimit = 0;
                      this.dashArray = [];
                      this.dashPhase = 0;
                      this.dependencies = [];
                      this.activeClipUrl = null;
                      this.clipGroup = null;
                      this.maskId = ""
                  }
                  t.prototype = {
                      clone: function e() {
                          return Object.create(this)
                      },
                      setCurrentPoint: function e(t, r) {
                          this.x = t;
                          this.y = r
                      }
                  };
                  return t
              }();
              t.SVGGraphics = a = function e() {
                  function t(e) {
                      var t = [];
                      var r = [];
                      var n = e.length;
                      for (var a = 0; a < n; a++) {
                          if (e[a].fn === "save") {
                              t.push({
                                  fnId: 92,
                                  fn: "group",
                                  items: []
                              });
                              r.push(t);
                              t = t[t.length - 1].items;
                              continue
                          }
                          if (e[a].fn === "restore") {
                              t = r.pop()
                          } else {
                              t.push(e[a])
                          }
                      }
                      return t
                  }
                  function r(e) {
                      if (e === (e | 0)) {
                          return e.toString()
                      }
                      var t = e.toFixed(10);
                      var r = t.length - 1;
                      if (t[r] !== "0") {
                          return t
                      }
                      do {
                          r--
                      } while (t[r] === "0");
                      return t.substr(0, t[r] === "." ? r : r + 1)
                  }
                  function a(e) {
                      if (e[4] === 0 && e[5] === 0) {
                          if (e[1] === 0 && e[2] === 0) {
                              if (e[0] === 1 && e[3] === 1) {
                                  return ""
                              }
                              return "scale(" + r(e[0]) + " " + r(e[3]) + ")"
                          }
                          if (e[0] === e[3] && e[1] === -e[2]) {
                              var t = Math.acos(e[0]) * 180 / Math.PI;
                              return "rotate(" + r(t) + ")"
                          }
                      } else {
                          if (e[0] === 1 && e[1] === 0 && e[2] === 0 && e[3] === 1) {
                              return "translate(" + r(e[4]) + " " + r(e[5]) + ")"
                          }
                      }
                      return "matrix(" + r(e[0]) + " " + r(e[1]) + " " + r(e[2]) + " " + r(e[3]) + " " + r(e[4]) + " " + r(e[5]) + ")"
                  }
                  function l(e, t, r) {
                      this.current = new o;
                      this.transformMatrix = n.IDENTITY_MATRIX;
                      this.transformStack = [];
                      this.extraStack = [];
                      this.commonObjs = e;
                      this.objs = t;
                      this.pendingClip = null;
                      this.pendingEOFill = false;
                      this.embedFonts = false;
                      this.embeddedFonts = Object.create(null);
                      this.cssStyle = null;
                      this.forceDataSchema = !!r
                  }
                  var u = "http://www.w3.org/2000/svg";
                  var c = "http://www.w3.org/XML/1998/namespace";
                  var f = "http://www.w3.org/1999/xlink";
                  var d = ["butt", "round", "square"];
                  var h = ["miter", "round", "bevel"];
                  var p = 0;
                  var v = 0;
                  l.prototype = {
                      save: function e() {
                          this.transformStack.push(this.transformMatrix);
                          var t = this.current;
                          this.extraStack.push(t);
                          this.current = t.clone()
                      },
                      restore: function e() {
                          this.transformMatrix = this.transformStack.pop();
                          this.current = this.extraStack.pop();
                          this.pendingClip = null;
                          this.tgrp = null
                      },
                      group: function e(t) {
                          this.save();
                          this.executeOpTree(t);
                          this.restore()
                      },
                      loadDependencies: function e(t) {
                          var r = this;
                          var a = t.fnArray;
                          var i = a.length;
                          var s = t.argsArray;
                          for (var o = 0; o < i; o++) {
                              if (n.OPS.dependency === a[o]) {
                                  var l = s[o];
                                  for (var u = 0, c = l.length; u < c; u++) {
                                      var f = l[u];
                                      var d = f.substring(0, 2) === "g_";
                                      var h;
                                      if (d) {
                                          h = new Promise(function(e) {
                                              r.commonObjs.get(f, e)
                                          }
                                          )
                                      } else {
                                          h = new Promise(function(e) {
                                              r.objs.get(f, e)
                                          }
                                          )
                                      }
                                      this.current.dependencies.push(h)
                                  }
                              }
                          }
                          return Promise.all(this.current.dependencies)
                      },
                      transform: function e(t, r, a, i, s, o) {
                          var l = [t, r, a, i, s, o];
                          this.transformMatrix = n.Util.transform(this.transformMatrix, l);
                          this.tgrp = null
                      },
                      getSVG: function e(t, r) {
                          var a = this;
                          this.viewport = r;
                          var i = this._initialize(r);
                          return this.loadDependencies(t).then(function() {
                              a.transformMatrix = n.IDENTITY_MATRIX;
                              var e = a.convertOpList(t);
                              a.executeOpTree(e);
                              return i
                          })
                      },
                      convertOpList: function e(r) {
                          var a = r.argsArray;
                          var i = r.fnArray;
                          var s = i.length;
                          var o = [];
                          var l = [];
                          for (var u in n.OPS) {
                              o[n.OPS[u]] = u
                          }
                          for (var c = 0; c < s; c++) {
                              var f = i[c];
                              l.push({
                                  fnId: f,
                                  fn: o[f],
                                  args: a[c]
                              })
                          }
                          return t(l)
                      },
                      executeOpTree: function e(t) {
                          var r = t.length;
                          for (var a = 0; a < r; a++) {
                              var i = t[a].fn;
                              var s = t[a].fnId;
                              var o = t[a].args;
                              switch (s | 0) {
                              case n.OPS.beginText:
                                  this.beginText();
                                  break;
                              case n.OPS.setLeading:
                                  this.setLeading(o);
                                  break;
                              case n.OPS.setLeadingMoveText:
                                  this.setLeadingMoveText(o[0], o[1]);
                                  break;
                              case n.OPS.setFont:
                                  this.setFont(o);
                                  break;
                              case n.OPS.showText:
                                  this.showText(o[0]);
                                  break;
                              case n.OPS.showSpacedText:
                                  this.showText(o[0]);
                                  break;
                              case n.OPS.endText:
                                  this.endText();
                                  break;
                              case n.OPS.moveText:
                                  this.moveText(o[0], o[1]);
                                  break;
                              case n.OPS.setCharSpacing:
                                  this.setCharSpacing(o[0]);
                                  break;
                              case n.OPS.setWordSpacing:
                                  this.setWordSpacing(o[0]);
                                  break;
                              case n.OPS.setHScale:
                                  this.setHScale(o[0]);
                                  break;
                              case n.OPS.setTextMatrix:
                                  this.setTextMatrix(o[0], o[1], o[2], o[3], o[4], o[5]);
                                  break;
                              case n.OPS.setLineWidth:
                                  this.setLineWidth(o[0]);
                                  break;
                              case n.OPS.setLineJoin:
                                  this.setLineJoin(o[0]);
                                  break;
                              case n.OPS.setLineCap:
                                  this.setLineCap(o[0]);
                                  break;
                              case n.OPS.setMiterLimit:
                                  this.setMiterLimit(o[0]);
                                  break;
                              case n.OPS.setFillRGBColor:
                                  this.setFillRGBColor(o[0], o[1], o[2]);
                                  break;
                              case n.OPS.setStrokeRGBColor:
                                  this.setStrokeRGBColor(o[0], o[1], o[2]);
                                  break;
                              case n.OPS.setDash:
                                  this.setDash(o[0], o[1]);
                                  break;
                              case n.OPS.setGState:
                                  this.setGState(o[0]);
                                  break;
                              case n.OPS.fill:
                                  this.fill();
                                  break;
                              case n.OPS.eoFill:
                                  this.eoFill();
                                  break;
                              case n.OPS.stroke:
                                  this.stroke();
                                  break;
                              case n.OPS.fillStroke:
                                  this.fillStroke();
                                  break;
                              case n.OPS.eoFillStroke:
                                  this.eoFillStroke();
                                  break;
                              case n.OPS.clip:
                                  this.clip("nonzero");
                                  break;
                              case n.OPS.eoClip:
                                  this.clip("evenodd");
                                  break;
                              case n.OPS.paintSolidColorImageMask:
                                  this.paintSolidColorImageMask();
                                  break;
                              case n.OPS.paintJpegXObject:
                                  this.paintJpegXObject(o[0], o[1], o[2]);
                                  break;
                              case n.OPS.paintImageXObject:
                                  this.paintImageXObject(o[0]);
                                  break;
                              case n.OPS.paintInlineImageXObject:
                                  this.paintInlineImageXObject(o[0]);
                                  break;
                              case n.OPS.paintImageMaskXObject:
                                  this.paintImageMaskXObject(o[0]);
                                  break;
                              case n.OPS.paintFormXObjectBegin:
                                  this.paintFormXObjectBegin(o[0], o[1]);
                                  break;
                              case n.OPS.paintFormXObjectEnd:
                                  this.paintFormXObjectEnd();
                                  break;
                              case n.OPS.closePath:
                                  this.closePath();
                                  break;
                              case n.OPS.closeStroke:
                                  this.closeStroke();
                                  break;
                              case n.OPS.closeFillStroke:
                                  this.closeFillStroke();
                                  break;
                              case n.OPS.nextLine:
                                  this.nextLine();
                                  break;
                              case n.OPS.transform:
                                  this.transform(o[0], o[1], o[2], o[3], o[4], o[5]);
                                  break;
                              case n.OPS.constructPath:
                                  this.constructPath(o[0], o[1]);
                                  break;
                              case n.OPS.endPath:
                                  this.endPath();
                                  break;
                              case 92:
                                  this.group(t[a].items);
                                  break;
                              default:
                                  (0,
                                  n.warn)("Unimplemented operator " + i);
                                  break
                              }
                          }
                      },
                      setWordSpacing: function e(t) {
                          this.current.wordSpacing = t
                      },
                      setCharSpacing: function e(t) {
                          this.current.charSpacing = t
                      },
                      nextLine: function e() {
                          this.moveText(0, this.current.leading)
                      },
                      setTextMatrix: function e(t, n, a, i, s, o) {
                          var l = this.current;
                          this.current.textMatrix = this.current.lineMatrix = [t, n, a, i, s, o];
                          this.current.x = this.current.lineX = 0;
                          this.current.y = this.current.lineY = 0;
                          l.xcoords = [];
                          l.tspan = document.createElementNS(u, "svg:tspan");
                          l.tspan.setAttributeNS(null, "font-family", l.fontFamily);
                          l.tspan.setAttributeNS(null, "font-size", r(l.fontSize) + "px");
                          l.tspan.setAttributeNS(null, "y", r(-l.y));
                          l.txtElement = document.createElementNS(u, "svg:text");
                          l.txtElement.appendChild(l.tspan)
                      },
                      beginText: function e() {
                          this.current.x = this.current.lineX = 0;
                          this.current.y = this.current.lineY = 0;
                          this.current.textMatrix = n.IDENTITY_MATRIX;
                          this.current.lineMatrix = n.IDENTITY_MATRIX;
                          this.current.tspan = document.createElementNS(u, "svg:tspan");
                          this.current.txtElement = document.createElementNS(u, "svg:text");
                          this.current.txtgrp = document.createElementNS(u, "svg:g");
                          this.current.xcoords = []
                      },
                      moveText: function e(t, n) {
                          var a = this.current;
                          this.current.x = this.current.lineX += t;
                          this.current.y = this.current.lineY += n;
                          a.xcoords = [];
                          a.tspan = document.createElementNS(u, "svg:tspan");
                          a.tspan.setAttributeNS(null, "font-family", a.fontFamily);
                          a.tspan.setAttributeNS(null, "font-size", r(a.fontSize) + "px");
                          a.tspan.setAttributeNS(null, "y", r(-a.y))
                      },
                      showText: function e(t) {
                          var s = this.current;
                          var o = s.font;
                          var l = s.fontSize;
                          if (l === 0) {
                              return
                          }
                          var u = s.charSpacing;
                          var f = s.wordSpacing;
                          var d = s.fontDirection;
                          var h = s.textHScale * d;
                          var p = t.length;
                          var v = o.vertical;
                          var m = l * s.fontMatrix[0];
                          var g = 0, b;
                          for (b = 0; b < p; ++b) {
                              var _ = t[b];
                              if (_ === null) {
                                  g += d * f;
                                  continue
                              } else if ((0,
                              n.isNum)(_)) {
                                  g += -_ * l * .001;
                                  continue
                              }
                              s.xcoords.push(s.x + g * h);
                              var y = _.width;
                              var A = _.fontChar;
                              var S = (_.isSpace ? f : 0) + u;
                              var w = y * m + S * d;
                              g += w;
                              s.tspan.textContent += A
                          }
                          if (v) {
                              s.y -= g * h
                          } else {
                              s.x += g * h
                          }
                          s.tspan.setAttributeNS(null, "x", s.xcoords.map(r).join(" "));
                          s.tspan.setAttributeNS(null, "y", r(-s.y));
                          s.tspan.setAttributeNS(null, "font-family", s.fontFamily);
                          s.tspan.setAttributeNS(null, "font-size", r(s.fontSize) + "px");
                          if (s.fontStyle !== i.fontStyle) {
                              s.tspan.setAttributeNS(null, "font-style", s.fontStyle)
                          }
                          if (s.fontWeight !== i.fontWeight) {
                              s.tspan.setAttributeNS(null, "font-weight", s.fontWeight)
                          }
                          if (s.fillColor !== i.fillColor) {
                              s.tspan.setAttributeNS(null, "fill", s.fillColor)
                          }
                          s.txtElement.setAttributeNS(null, "transform", a(s.textMatrix) + " scale(1, -1)");
                          s.txtElement.setAttributeNS(c, "xml:space", "preserve");
                          s.txtElement.appendChild(s.tspan);
                          s.txtgrp.appendChild(s.txtElement);
                          this._ensureTransformGroup().appendChild(s.txtElement)
                      },
                      setLeadingMoveText: function e(t, r) {
                          this.setLeading(-r);
                          this.moveText(t, r)
                      },
                      addFontStyle: function e(t) {
                          if (!this.cssStyle) {
                              this.cssStyle = document.createElementNS(u, "svg:style");
                              this.cssStyle.setAttributeNS(null, "type", "text/css");
                              this.defs.appendChild(this.cssStyle)
                          }
                          var r = (0,
                          n.createObjectURL)(t.data, t.mimetype, this.forceDataSchema);
                          this.cssStyle.textContent += '@font-face { font-family: "' + t.loadedName + '";' + " src: url(" + r + "); }\n"
                      },
                      setFont: function e(t) {
                          var a = this.current;
                          var i = this.commonObjs.get(t[0]);
                          var s = t[1];
                          this.current.font = i;
                          if (this.embedFonts && i.data && !this.embeddedFonts[i.loadedName]) {
                              this.addFontStyle(i);
                              this.embeddedFonts[i.loadedName] = i
                          }
                          a.fontMatrix = i.fontMatrix ? i.fontMatrix : n.FONT_IDENTITY_MATRIX;
                          var o = i.black ? i.bold ? "bolder" : "bold" : i.bold ? "bold" : "normal";
                          var l = i.italic ? "italic" : "normal";
                          if (s < 0) {
                              s = -s;
                              a.fontDirection = -1
                          } else {
                              a.fontDirection = 1
                          }
                          a.fontSize = s;
                          a.fontFamily = i.loadedName;
                          a.fontWeight = o;
                          a.fontStyle = l;
                          a.tspan = document.createElementNS(u, "svg:tspan");
                          a.tspan.setAttributeNS(null, "y", r(-a.y));
                          a.xcoords = []
                      },
                      endText: function e() {},
                      setLineWidth: function e(t) {
                          this.current.lineWidth = t
                      },
                      setLineCap: function e(t) {
                          this.current.lineCap = d[t]
                      },
                      setLineJoin: function e(t) {
                          this.current.lineJoin = h[t]
                      },
                      setMiterLimit: function e(t) {
                          this.current.miterLimit = t
                      },
                      setStrokeAlpha: function e(t) {
                          this.current.strokeAlpha = t
                      },
                      setStrokeRGBColor: function e(t, r, a) {
                          var i = n.Util.makeCssRgb(t, r, a);
                          this.current.strokeColor = i
                      },
                      setFillAlpha: function e(t) {
                          this.current.fillAlpha = t
                      },
                      setFillRGBColor: function e(t, r, a) {
                          var i = n.Util.makeCssRgb(t, r, a);
                          this.current.fillColor = i;
                          this.current.tspan = document.createElementNS(u, "svg:tspan");
                          this.current.xcoords = []
                      },
                      setDash: function e(t, r) {
                          this.current.dashArray = t;
                          this.current.dashPhase = r
                      },
                      constructPath: function e(t, a) {
                          var i = this.current;
                          var s = i.x
                            , o = i.y;
                          i.path = document.createElementNS(u, "svg:path");
                          var l = [];
                          var c = t.length;
                          for (var f = 0, d = 0; f < c; f++) {
                              switch (t[f] | 0) {
                              case n.OPS.rectangle:
                                  s = a[d++];
                                  o = a[d++];
                                  var h = a[d++];
                                  var p = a[d++];
                                  var v = s + h;
                                  var m = o + p;
                                  l.push("M", r(s), r(o), "L", r(v), r(o), "L", r(v), r(m), "L", r(s), r(m), "Z");
                                  break;
                              case n.OPS.moveTo:
                                  s = a[d++];
                                  o = a[d++];
                                  l.push("M", r(s), r(o));
                                  break;
                              case n.OPS.lineTo:
                                  s = a[d++];
                                  o = a[d++];
                                  l.push("L", r(s), r(o));
                                  break;
                              case n.OPS.curveTo:
                                  s = a[d + 4];
                                  o = a[d + 5];
                                  l.push("C", r(a[d]), r(a[d + 1]), r(a[d + 2]), r(a[d + 3]), r(s), r(o));
                                  d += 6;
                                  break;
                              case n.OPS.curveTo2:
                                  s = a[d + 2];
                                  o = a[d + 3];
                                  l.push("C", r(s), r(o), r(a[d]), r(a[d + 1]), r(a[d + 2]), r(a[d + 3]));
                                  d += 4;
                                  break;
                              case n.OPS.curveTo3:
                                  s = a[d + 2];
                                  o = a[d + 3];
                                  l.push("C", r(a[d]), r(a[d + 1]), r(s), r(o), r(s), r(o));
                                  d += 4;
                                  break;
                              case n.OPS.closePath:
                                  l.push("Z");
                                  break
                              }
                          }
                          i.path.setAttributeNS(null, "d", l.join(" "));
                          i.path.setAttributeNS(null, "fill", "none");
                          this._ensureTransformGroup().appendChild(i.path);
                          i.element = i.path;
                          i.setCurrentPoint(s, o)
                      },
                      endPath: function e() {
                          if (!this.pendingClip) {
                              return
                          }
                          var t = this.current;
                          var r = "clippath" + p;
                          p++;
                          var n = document.createElementNS(u, "svg:clipPath");
                          n.setAttributeNS(null, "id", r);
                          n.setAttributeNS(null, "transform", a(this.transformMatrix));
                          var i = t.element.cloneNode();
                          if (this.pendingClip === "evenodd") {
                              i.setAttributeNS(null, "clip-rule", "evenodd")
                          } else {
                              i.setAttributeNS(null, "clip-rule", "nonzero")
                          }
                          this.pendingClip = null;
                          n.appendChild(i);
                          this.defs.appendChild(n);
                          if (t.activeClipUrl) {
                              t.clipGroup = null;
                              this.extraStack.forEach(function(e) {
                                  e.clipGroup = null
                              })
                          }
                          t.activeClipUrl = "url(#" + r + ")";
                          this.tgrp = null
                      },
                      clip: function e(t) {
                          this.pendingClip = t
                      },
                      closePath: function e() {
                          var t = this.current;
                          var r = t.path.getAttributeNS(null, "d");
                          r += "Z";
                          t.path.setAttributeNS(null, "d", r)
                      },
                      setLeading: function e(t) {
                          this.current.leading = -t
                      },
                      setTextRise: function e(t) {
                          this.current.textRise = t
                      },
                      setHScale: function e(t) {
                          this.current.textHScale = t / 100
                      },
                      setGState: function e(t) {
                          for (var r = 0, a = t.length; r < a; r++) {
                              var i = t[r];
                              var s = i[0];
                              var o = i[1];
                              switch (s) {
                              case "LW":
                                  this.setLineWidth(o);
                                  break;
                              case "LC":
                                  this.setLineCap(o);
                                  break;
                              case "LJ":
                                  this.setLineJoin(o);
                                  break;
                              case "ML":
                                  this.setMiterLimit(o);
                                  break;
                              case "D":
                                  this.setDash(o[0], o[1]);
                                  break;
                              case "Font":
                                  this.setFont(o);
                                  break;
                              case "CA":
                                  this.setStrokeAlpha(o);
                                  break;
                              case "ca":
                                  this.setFillAlpha(o);
                                  break;
                              default:
                                  (0,
                                  n.warn)("Unimplemented graphic state " + s);
                                  break
                              }
                          }
                      },
                      fill: function e() {
                          var t = this.current;
                          t.element.setAttributeNS(null, "fill", t.fillColor);
                          t.element.setAttributeNS(null, "fill-opacity", t.fillAlpha)
                      },
                      stroke: function e() {
                          var t = this.current;
                          t.element.setAttributeNS(null, "stroke", t.strokeColor);
                          t.element.setAttributeNS(null, "stroke-opacity", t.strokeAlpha);
                          t.element.setAttributeNS(null, "stroke-miterlimit", r(t.miterLimit));
                          t.element.setAttributeNS(null, "stroke-linecap", t.lineCap);
                          t.element.setAttributeNS(null, "stroke-linejoin", t.lineJoin);
                          t.element.setAttributeNS(null, "stroke-width", r(t.lineWidth) + "px");
                          t.element.setAttributeNS(null, "stroke-dasharray", t.dashArray.map(r).join(" "));
                          t.element.setAttributeNS(null, "stroke-dashoffset", r(t.dashPhase) + "px");
                          t.element.setAttributeNS(null, "fill", "none")
                      },
                      eoFill: function e() {
                          this.current.element.setAttributeNS(null, "fill-rule", "evenodd");
                          this.fill()
                      },
                      fillStroke: function e() {
                          this.stroke();
                          this.fill()
                      },
                      eoFillStroke: function e() {
                          this.current.element.setAttributeNS(null, "fill-rule", "evenodd");
                          this.fillStroke()
                      },
                      closeStroke: function e() {
                          this.closePath();
                          this.stroke()
                      },
                      closeFillStroke: function e() {
                          this.closePath();
                          this.fillStroke()
                      },
                      paintSolidColorImageMask: function e() {
                          var t = this.current;
                          var r = document.createElementNS(u, "svg:rect");
                          r.setAttributeNS(null, "x", "0");
                          r.setAttributeNS(null, "y", "0");
                          r.setAttributeNS(null, "width", "1px");
                          r.setAttributeNS(null, "height", "1px");
                          r.setAttributeNS(null, "fill", t.fillColor);
                          this._ensureTransformGroup().appendChild(r)
                      },
                      paintJpegXObject: function e(t, n, a) {
                          var i = this.objs.get(t);
                          var s = document.createElementNS(u, "svg:image");
                          s.setAttributeNS(f, "xlink:href", i.src);
                          s.setAttributeNS(null, "width", r(n));
                          s.setAttributeNS(null, "height", r(a));
                          s.setAttributeNS(null, "x", "0");
                          s.setAttributeNS(null, "y", r(-a));
                          s.setAttributeNS(null, "transform", "scale(" + r(1 / n) + " " + r(-1 / a) + ")");
                          this._ensureTransformGroup().appendChild(s)
                      },
                      paintImageXObject: function e(t) {
                          var r = this.objs.get(t);
                          if (!r) {
                              (0,
                              n.warn)("Dependent image isn't ready yet");
                              return
                          }
                          this.paintInlineImageXObject(r)
                      },
                      paintInlineImageXObject: function e(t, n) {
                          var a = t.width;
                          var i = t.height;
                          var o = s(t, this.forceDataSchema);
                          var l = document.createElementNS(u, "svg:rect");
                          l.setAttributeNS(null, "x", "0");
                          l.setAttributeNS(null, "y", "0");
                          l.setAttributeNS(null, "width", r(a));
                          l.setAttributeNS(null, "height", r(i));
                          this.current.element = l;
                          this.clip("nonzero");
                          var c = document.createElementNS(u, "svg:image");
                          c.setAttributeNS(f, "xlink:href", o);
                          c.setAttributeNS(null, "x", "0");
                          c.setAttributeNS(null, "y", r(-i));
                          c.setAttributeNS(null, "width", r(a) + "px");
                          c.setAttributeNS(null, "height", r(i) + "px");
                          c.setAttributeNS(null, "transform", "scale(" + r(1 / a) + " " + r(-1 / i) + ")");
                          if (n) {
                              n.appendChild(c)
                          } else {
                              this._ensureTransformGroup().appendChild(c)
                          }
                      },
                      paintImageMaskXObject: function e(t) {
                          var n = this.current;
                          var a = t.width;
                          var i = t.height;
                          var s = n.fillColor;
                          n.maskId = "mask" + v++;
                          var o = document.createElementNS(u, "svg:mask");
                          o.setAttributeNS(null, "id", n.maskId);
                          var l = document.createElementNS(u, "svg:rect");
                          l.setAttributeNS(null, "x", "0");
                          l.setAttributeNS(null, "y", "0");
                          l.setAttributeNS(null, "width", r(a));
                          l.setAttributeNS(null, "height", r(i));
                          l.setAttributeNS(null, "fill", s);
                          l.setAttributeNS(null, "mask", "url(#" + n.maskId + ")");
                          this.defs.appendChild(o);
                          this._ensureTransformGroup().appendChild(l);
                          this.paintInlineImageXObject(t, o)
                      },
                      paintFormXObjectBegin: function e(t, a) {
                          if ((0,
                          n.isArray)(t) && t.length === 6) {
                              this.transform(t[0], t[1], t[2], t[3], t[4], t[5])
                          }
                          if ((0,
                          n.isArray)(a) && a.length === 4) {
                              var i = a[2] - a[0];
                              var s = a[3] - a[1];
                              var o = document.createElementNS(u, "svg:rect");
                              o.setAttributeNS(null, "x", a[0]);
                              o.setAttributeNS(null, "y", a[1]);
                              o.setAttributeNS(null, "width", r(i));
                              o.setAttributeNS(null, "height", r(s));
                              this.current.element = o;
                              this.clip("nonzero");
                              this.endPath()
                          }
                      },
                      paintFormXObjectEnd: function e() {},
                      _initialize: function e(t) {
                          var r = document.createElementNS(u, "svg:svg");
                          r.setAttributeNS(null, "version", "1.1");
                          r.setAttributeNS(null, "width", t.width + "px");
                          r.setAttributeNS(null, "height", t.height + "px");
                          r.setAttributeNS(null, "preserveAspectRatio", "none");
                          r.setAttributeNS(null, "viewBox", "0 0 " + t.width + " " + t.height);
                          var n = document.createElementNS(u, "svg:defs");
                          r.appendChild(n);
                          this.defs = n;
                          var i = document.createElementNS(u, "svg:g");
                          i.setAttributeNS(null, "transform", a(t.transform));
                          r.appendChild(i);
                          this.svg = i;
                          return r
                      },
                      _ensureClipGroup: function e() {
                          if (!this.current.clipGroup) {
                              var t = document.createElementNS(u, "svg:g");
                              t.setAttributeNS(null, "clip-path", this.current.activeClipUrl);
                              this.svg.appendChild(t);
                              this.current.clipGroup = t
                          }
                          return this.current.clipGroup
                      },
                      _ensureTransformGroup: function e() {
                          if (!this.tgrp) {
                              this.tgrp = document.createElementNS(u, "svg:g");
                              this.tgrp.setAttributeNS(null, "transform", a(this.transformMatrix));
                              if (this.current.activeClipUrl) {
                                  this._ensureClipGroup().appendChild(this.tgrp)
                              } else {
                                  this.svg.appendChild(this.tgrp)
                              }
                          }
                          return this.tgrp
                      }
                  };
                  return l
              }()
          }
          t.SVGGraphics = a
      }
      , function(e, t, r) {
          "use strict";
          Object.defineProperty(t, "__esModule", {
              value: true
          });
          t.renderTextLayer = undefined;
          var n = r(0);
          var a = r(1);
          var i = function e() {
              var t = 1e5;
              var r = /\S/;
              function i(e) {
                  return !r.test(e)
              }
              var s = ["left: ", 0, "px; top: ", 0, "px; font-size: ", 0, "px; font-family: ", "", ";"];
              function o(e, t, r) {
                  var o = document.createElement("div");
                  var l = {
                      style: null,
                      angle: 0,
                      canvasWidth: 0,
                      isWhitespace: false,
                      originalTransform: null,
                      paddingBottom: 0,
                      paddingLeft: 0,
                      paddingRight: 0,
                      paddingTop: 0,
                      scale: 1
                  };
                  e._textDivs.push(o);
                  if (i(t.str)) {
                      l.isWhitespace = true;
                      e._textDivProperties.set(o, l);
                      return
                  }
                  var u = n.Util.transform(e._viewport.transform, t.transform);
                  var c = Math.atan2(u[1], u[0]);
                  var f = r[t.fontName];
                  if (f.vertical) {
                      c += Math.PI / 2
                  }
                  var d = Math.sqrt(u[2] * u[2] + u[3] * u[3]);
                  var h = d;
                  if (f.ascent) {
                      h = f.ascent * h
                  } else if (f.descent) {
                      h = (1 + f.descent) * h
                  }
                  var p;
                  var v;
                  if (c === 0) {
                      p = u[4];
                      v = u[5] - h
                  } else {
                      p = u[4] + h * Math.sin(c);
                      v = u[5] - h * Math.cos(c)
                  }
                  s[1] = p;
                  s[3] = v;
                  s[5] = d;
                  s[7] = f.fontFamily;
                  l.style = s.join("");
                  o.setAttribute("style", l.style);
                  o.textContent = t.str;
                  if ((0,
                  a.getDefaultSetting)("pdfBug")) {
                      o.dataset.fontName = t.fontName
                  }
                  if (c !== 0) {
                      l.angle = c * (180 / Math.PI)
                  }
                  if (t.str.length > 1) {
                      if (f.vertical) {
                          l.canvasWidth = t.height * e._viewport.scale
                      } else {
                          l.canvasWidth = t.width * e._viewport.scale
                      }
                  }
                  e._textDivProperties.set(o, l);
                  if (e._textContentStream) {
                      e._layoutText(o)
                  }
                  if (e._enhanceTextSelection) {
                      var m = 1
                        , g = 0;
                      if (c !== 0) {
                          m = Math.cos(c);
                          g = Math.sin(c)
                      }
                      var b = (f.vertical ? t.height : t.width) * e._viewport.scale;
                      var _ = d;
                      var y, A;
                      if (c !== 0) {
                          y = [m, g, -g, m, p, v];
                          A = n.Util.getAxialAlignedBoundingBox([0, 0, b, _], y)
                      } else {
                          A = [p, v, p + b, v + _]
                      }
                      e._bounds.push({
                          left: A[0],
                          top: A[1],
                          right: A[2],
                          bottom: A[3],
                          div: o,
                          size: [b, _],
                          m: y
                      })
                  }
              }
              function l(e) {
                  if (e._canceled) {
                      return
                  }
                  var r = e._textDivs;
                  var n = e._capability;
                  var a = r.length;
                  if (a > t) {
                      e._renderingDone = true;
                      n.resolve();
                      return
                  }
                  if (!e._textContentStream) {
                      for (var i = 0; i < a; i++) {
                          e._layoutText(r[i])
                      }
                  }
                  e._renderingDone = true;
                  n.resolve()
              }
              function u(e) {
                  var t = e._bounds;
                  var r = e._viewport;
                  var a = c(r.width, r.height, t);
                  for (var i = 0; i < a.length; i++) {
                      var s = t[i].div;
                      var o = e._textDivProperties.get(s);
                      if (o.angle === 0) {
                          o.paddingLeft = t[i].left - a[i].left;
                          o.paddingTop = t[i].top - a[i].top;
                          o.paddingRight = a[i].right - t[i].right;
                          o.paddingBottom = a[i].bottom - t[i].bottom;
                          e._textDivProperties.set(s, o);
                          continue
                      }
                      var l = a[i]
                        , u = t[i];
                      var f = u.m
                        , d = f[0]
                        , h = f[1];
                      var p = [[0, 0], [0, u.size[1]], [u.size[0], 0], u.size];
                      var v = new Float64Array(64);
                      p.forEach(function(e, t) {
                          var r = n.Util.applyTransform(e, f);
                          v[t + 0] = d && (l.left - r[0]) / d;
                          v[t + 4] = h && (l.top - r[1]) / h;
                          v[t + 8] = d && (l.right - r[0]) / d;
                          v[t + 12] = h && (l.bottom - r[1]) / h;
                          v[t + 16] = h && (l.left - r[0]) / -h;
                          v[t + 20] = d && (l.top - r[1]) / d;
                          v[t + 24] = h && (l.right - r[0]) / -h;
                          v[t + 28] = d && (l.bottom - r[1]) / d;
                          v[t + 32] = d && (l.left - r[0]) / -d;
                          v[t + 36] = h && (l.top - r[1]) / -h;
                          v[t + 40] = d && (l.right - r[0]) / -d;
                          v[t + 44] = h && (l.bottom - r[1]) / -h;
                          v[t + 48] = h && (l.left - r[0]) / h;
                          v[t + 52] = d && (l.top - r[1]) / -d;
                          v[t + 56] = h && (l.right - r[0]) / h;
                          v[t + 60] = d && (l.bottom - r[1]) / -d
                      });
                      var m = function e(t, r, n) {
                          var a = 0;
                          for (var i = 0; i < n; i++) {
                              var s = t[r++];
                              if (s > 0) {
                                  a = a ? Math.min(s, a) : s
                              }
                          }
                          return a
                      };
                      var g = 1 + Math.min(Math.abs(d), Math.abs(h));
                      o.paddingLeft = m(v, 32, 16) / g;
                      o.paddingTop = m(v, 48, 16) / g;
                      o.paddingRight = m(v, 0, 16) / g;
                      o.paddingBottom = m(v, 16, 16) / g;
                      e._textDivProperties.set(s, o)
                  }
              }
              function c(e, t, r) {
                  var n = r.map(function(e, t) {
                      return {
                          x1: e.left,
                          y1: e.top,
                          x2: e.right,
                          y2: e.bottom,
                          index: t,
                          x1New: undefined,
                          x2New: undefined
                      }
                  });
                  f(e, n);
                  var a = new Array(r.length);
                  n.forEach(function(e) {
                      var t = e.index;
                      a[t] = {
                          left: e.x1New,
                          top: 0,
                          right: e.x2New,
                          bottom: 0
                      }
                  });
                  r.map(function(t, r) {
                      var i = a[r]
                        , s = n[r];
                      s.x1 = t.top;
                      s.y1 = e - i.right;
                      s.x2 = t.bottom;
                      s.y2 = e - i.left;
                      s.index = r;
                      s.x1New = undefined;
                      s.x2New = undefined
                  });
                  f(t, n);
                  n.forEach(function(e) {
                      var t = e.index;
                      a[t].top = e.x1New;
                      a[t].bottom = e.x2New
                  });
                  return a
              }
              function f(e, t) {
                  t.sort(function(e, t) {
                      return e.x1 - t.x1 || e.index - t.index
                  });
                  var r = {
                      x1: -Infinity,
                      y1: -Infinity,
                      x2: 0,
                      y2: Infinity,
                      index: -1,
                      x1New: 0,
                      x2New: 0
                  };
                  var n = [{
                      start: -Infinity,
                      end: Infinity,
                      boundary: r
                  }];
                  t.forEach(function(e) {
                      var t = 0;
                      while (t < n.length && n[t].end <= e.y1) {
                          t++
                      }
                      var r = n.length - 1;
                      while (r >= 0 && n[r].start >= e.y2) {
                          r--
                      }
                      var a, i;
                      var s, o, l = -Infinity;
                      for (s = t; s <= r; s++) {
                          a = n[s];
                          i = a.boundary;
                          var u;
                          if (i.x2 > e.x1) {
                              u = i.index > e.index ? i.x1New : e.x1
                          } else if (i.x2New === undefined) {
                              u = (i.x2 + e.x1) / 2
                          } else {
                              u = i.x2New
                          }
                          if (u > l) {
                              l = u
                          }
                      }
                      e.x1New = l;
                      for (s = t; s <= r; s++) {
                          a = n[s];
                          i = a.boundary;
                          if (i.x2New === undefined) {
                              if (i.x2 > e.x1) {
                                  if (i.index > e.index) {
                                      i.x2New = i.x2
                                  }
                              } else {
                                  i.x2New = l
                              }
                          } else if (i.x2New > l) {
                              i.x2New = Math.max(l, i.x2)
                          }
                      }
                      var c = []
                        , f = null;
                      for (s = t; s <= r; s++) {
                          a = n[s];
                          i = a.boundary;
                          var d = i.x2 > e.x2 ? i : e;
                          if (f === d) {
                              c[c.length - 1].end = a.end
                          } else {
                              c.push({
                                  start: a.start,
                                  end: a.end,
                                  boundary: d
                              });
                              f = d
                          }
                      }
                      if (n[t].start < e.y1) {
                          c[0].start = e.y1;
                          c.unshift({
                              start: n[t].start,
                              end: e.y1,
                              boundary: n[t].boundary
                          })
                      }
                      if (e.y2 < n[r].end) {
                          c[c.length - 1].end = e.y2;
                          c.push({
                              start: e.y2,
                              end: n[r].end,
                              boundary: n[r].boundary
                          })
                      }
                      for (s = t; s <= r; s++) {
                          a = n[s];
                          i = a.boundary;
                          if (i.x2New !== undefined) {
                              continue
                          }
                          var h = false;
                          for (o = t - 1; !h && o >= 0 && n[o].start >= i.y1; o--) {
                              h = n[o].boundary === i
                          }
                          for (o = r + 1; !h && o < n.length && n[o].end <= i.y2; o++) {
                              h = n[o].boundary === i
                          }
                          for (o = 0; !h && o < c.length; o++) {
                              h = c[o].boundary === i
                          }
                          if (!h) {
                              i.x2New = l
                          }
                      }
                      Array.prototype.splice.apply(n, [t, r - t + 1].concat(c))
                  });
                  n.forEach(function(t) {
                      var r = t.boundary;
                      if (r.x2New === undefined) {
                          r.x2New = Math.max(e, r.x2)
                      }
                  })
              }
              function d(e) {
                  var t = e.textContent
                    , r = e.textContentStream
                    , a = e.container
                    , i = e.viewport
                    , s = e.textDivs
                    , o = e.textContentItemsStr
                    , l = e.enhanceTextSelection;
                  this._textContent = t;
                  this._textContentStream = r;
                  this._container = a;
                  this._viewport = i;
                  this._textDivs = s || [];
                  this._textContentItemsStr = o || [];
                  this._enhanceTextSelection = !!l;
                  this._reader = null;
                  this._layoutTextLastFontSize = null;
                  this._layoutTextLastFontFamily = null;
                  this._layoutTextCtx = null;
                  this._textDivProperties = new WeakMap;
                  this._renderingDone = false;
                  this._canceled = false;
                  this._capability = (0,
                  n.createPromiseCapability)();
                  this._renderTimer = null;
                  this._bounds = []
              }
              d.prototype = {
                  get promise() {
                      return this._capability.promise
                  },
                  cancel: function e() {
                      if (this._reader) {
                          this._reader.cancel(new n.AbortException("text layer task cancelled"));
                          this._reader = null
                      }
                      this._canceled = true;
                      if (this._renderTimer !== null) {
                          clearTimeout(this._renderTimer);
                          this._renderTimer = null
                      }
                      this._capability.reject("canceled")
                  },
                  _processItems: function e(t, r) {
                      for (var n = 0, a = t.length; n < a; n++) {
                          this._textContentItemsStr.push(t[n].str);
                          o(this, t[n], r)
                      }
                  },
                  _layoutText: function e(t) {
                      var r = this._container;
                      var n = this._textDivProperties.get(t);
                      if (n.isWhitespace) {
                          return
                      }
                      var i = t.style.fontSize;
                      var s = t.style.fontFamily;
                      if (i !== this._layoutTextLastFontSize || s !== this._layoutTextLastFontFamily) {
                          this._layoutTextCtx.font = i + " " + s;
                          this._lastFontSize = i;
                          this._lastFontFamily = s
                      }
                      var o = this._layoutTextCtx.measureText(t.textContent).width;
                      var l = "";
                      if (n.canvasWidth !== 0 && o > 0) {
                          n.scale = n.canvasWidth / o;
                          l = "scaleX(" + n.scale + ")"
                      }
                      if (n.angle !== 0) {
                          l = "rotate(" + n.angle + "deg) " + l
                      }
                      if (l !== "") {
                          n.originalTransform = l;
                          a.CustomStyle.setProp("transform", t, l)
                      }
                      this._textDivProperties.set(t, n);
                      r.appendChild(t)
                  },
                  _render: function e(t) {
                      var r = this;
                      var a = (0,
                      n.createPromiseCapability)();
                      var i = Object.create(null);
                      var s = document.createElement("canvas");
                      s.mozOpaque = true;
                      this._layoutTextCtx = s.getContext("2d", {
                          alpha: false
                      });
                      if (this._textContent) {
                          var o = this._textContent.items;
                          var u = this._textContent.styles;
                          this._processItems(o, u);
                          a.resolve()
                      } else if (this._textContentStream) {
                          var c = function e() {
                              r._reader.read().then(function(t) {
                                  var s = t.value
                                    , o = t.done;
                                  if (o) {
                                      a.resolve();
                                      return
                                  }
                                  n.Util.extendObj(i, s.styles);
                                  r._processItems(s.items, i);
                                  e()
                              }, a.reject)
                          };
                          this._reader = this._textContentStream.getReader();
                          c()
                      } else {
                          throw new Error('Neither "textContent" nor "textContentStream"' + " parameters specified.")
                      }
                      a.promise.then(function() {
                          i = null;
                          if (!t) {
                              l(r)
                          } else {
                              r._renderTimer = setTimeout(function() {
                                  l(r);
                                  r._renderTimer = null
                              }, t)
                          }
                      }, this._capability.reject)
                  },
                  expandTextDivs: function e(t) {
                      if (!this._enhanceTextSelection || !this._renderingDone) {
                          return
                      }
                      if (this._bounds !== null) {
                          u(this);
                          this._bounds = null
                      }
                      for (var r = 0, n = this._textDivs.length; r < n; r++) {
                          var i = this._textDivs[r];
                          var s = this._textDivProperties.get(i);
                          if (s.isWhitespace) {
                              continue
                          }
                          if (t) {
                              var o = ""
                                , l = "";
                              if (s.scale !== 1) {
                                  o = "scaleX(" + s.scale + ")"
                              }
                              if (s.angle !== 0) {
                                  o = "rotate(" + s.angle + "deg) " + o
                              }
                              if (s.paddingLeft !== 0) {
                                  l += " padding-left: " + s.paddingLeft / s.scale + "px;";
                                  o += " translateX(" + -s.paddingLeft / s.scale + "px)"
                              }
                              if (s.paddingTop !== 0) {
                                  l += " padding-top: " + s.paddingTop + "px;";
                                  o += " translateY(" + -s.paddingTop + "px)"
                              }
                              if (s.paddingRight !== 0) {
                                  l += " padding-right: " + s.paddingRight / s.scale + "px;"
                              }
                              if (s.paddingBottom !== 0) {
                                  l += " padding-bottom: " + s.paddingBottom + "px;"
                              }
                              if (l !== "") {
                                  i.setAttribute("style", s.style + l)
                              }
                              if (o !== "") {
                                  a.CustomStyle.setProp("transform", i, o)
                              }
                          } else {
                              i.style.padding = 0;
                              a.CustomStyle.setProp("transform", i, s.originalTransform || "")
                          }
                      }
                  }
              };
              function h(e) {
                  var t = new d({
                      textContent: e.textContent,
                      textContentStream: e.textContentStream,
                      container: e.container,
                      viewport: e.viewport,
                      textDivs: e.textDivs,
                      textContentItemsStr: e.textContentItemsStr,
                      enhanceTextSelection: e.enhanceTextSelection
                  });
                  t._render(e.timeout);
                  return t
              }
              return h
          }();
          t.renderTextLayer = i
      }
      , function(e, t, r) {
          "use strict";
          Object.defineProperty(t, "__esModule", {
              value: true
          });
          function n(e) {
              return e.replace(/>\\376\\377([^<]+)/g, function(e, t) {
                  var r = t.replace(/\\([0-3])([0-7])([0-7])/g, function(e, t, r, n) {
                      return String.fromCharCode(t * 64 + r * 8 + n * 1)
                  });
                  var n = "";
                  for (var a = 0; a < r.length; a += 2) {
                      var i = r.charCodeAt(a) * 256 + r.charCodeAt(a + 1);
                      n += i >= 32 && i < 127 && i !== 60 && i !== 62 && i !== 38 ? String.fromCharCode(i) : "&#x" + (65536 + i).toString(16).substring(1) + ";"
                  }
                  return ">" + n
              })
          }
          function a(e) {
              if (typeof e === "string") {
                  e = n(e);
                  var t = new DOMParser;
                  e = t.parseFromString(e, "application/xml")
              } else if (!(e instanceof Document)) {
                  throw new Error("Metadata: Invalid metadata object")
              }
              this.metaDocument = e;
              this.metadata = Object.create(null);
              this.parse()
          }
          a.prototype = {
              parse: function e() {
                  var t = this.metaDocument;
                  var r = t.documentElement;
                  if (r.nodeName.toLowerCase() !== "rdf:rdf") {
                      r = r.firstChild;
                      while (r && r.nodeName.toLowerCase() !== "rdf:rdf") {
                          r = r.nextSibling
                      }
                  }
                  var n = r ? r.nodeName.toLowerCase() : null;
                  if (!r || n !== "rdf:rdf" || !r.hasChildNodes()) {
                      return
                  }
                  var a = r.childNodes, i, s, o, l, u, c, f;
                  for (l = 0,
                  c = a.length; l < c; l++) {
                      i = a[l];
                      if (i.nodeName.toLowerCase() !== "rdf:description") {
                          continue
                      }
                      for (u = 0,
                      f = i.childNodes.length; u < f; u++) {
                          if (i.childNodes[u].nodeName.toLowerCase() !== "#text") {
                              s = i.childNodes[u];
                              o = s.nodeName.toLowerCase();
                              this.metadata[o] = s.textContent.trim()
                          }
                      }
                  }
              },
              get: function e(t) {
                  return this.metadata[t] || null
              },
              has: function e(t) {
                  return typeof this.metadata[t] !== "undefined"
              }
          };
          t.Metadata = a
      }
      , function(e, t, r) {
          "use strict";
          Object.defineProperty(t, "__esModule", {
              value: true
          });
          t.WebGLUtils = undefined;
          var n = r(1);
          var a = r(0);
          var i = function e() {
              function t(e, t, r) {
                  var n = e.createShader(r);
                  e.shaderSource(n, t);
                  e.compileShader(n);
                  var a = e.getShaderParameter(n, e.COMPILE_STATUS);
                  if (!a) {
                      var i = e.getShaderInfoLog(n);
                      throw new Error("Error during shader compilation: " + i)
                  }
                  return n
              }
              function r(e, r) {
                  return t(e, r, e.VERTEX_SHADER)
              }
              function i(e, r) {
                  return t(e, r, e.FRAGMENT_SHADER)
              }
              function s(e, t) {
                  var r = e.createProgram();
                  for (var n = 0, a = t.length; n < a; ++n) {
                      e.attachShader(r, t[n])
                  }
                  e.linkProgram(r);
                  var i = e.getProgramParameter(r, e.LINK_STATUS);
                  if (!i) {
                      var s = e.getProgramInfoLog(r);
                      throw new Error("Error during program linking: " + s)
                  }
                  return r
              }
              function o(e, t, r) {
                  e.activeTexture(r);
                  var n = e.createTexture();
                  e.bindTexture(e.TEXTURE_2D, n);
                  e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE);
                  e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE);
                  e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MIN_FILTER, e.NEAREST);
                  e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MAG_FILTER, e.NEAREST);
                  e.texImage2D(e.TEXTURE_2D, 0, e.RGBA, e.RGBA, e.UNSIGNED_BYTE, t);
                  return n
              }
              var l, u;
              function c() {
                  if (l) {
                      return
                  }
                  u = document.createElement("canvas");
                  l = u.getContext("webgl", {
                      premultipliedalpha: false
                  })
              }
              var f = "  attribute vec2 a_position;                                      attribute vec2 a_texCoord;                                                                                                      uniform vec2 u_resolution;                                                                                                      varying vec2 v_texCoord;                                                                                                        void main() {                                                     vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;       gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);                                                                              v_texCoord = a_texCoord;                                      }                                                             ";
              var d = "  precision mediump float;                                                                                                        uniform vec4 u_backdrop;                                        uniform int u_subtype;                                          uniform sampler2D u_image;                                      uniform sampler2D u_mask;                                                                                                       varying vec2 v_texCoord;                                                                                                        void main() {                                                     vec4 imageColor = texture2D(u_image, v_texCoord);               vec4 maskColor = texture2D(u_mask, v_texCoord);                 if (u_backdrop.a > 0.0) {                                         maskColor.rgb = maskColor.rgb * maskColor.a +                                   u_backdrop.rgb * (1.0 - maskColor.a);         }                                                               float lum;                                                      if (u_subtype == 0) {                                             lum = maskColor.a;                                            } else {                                                          lum = maskColor.r * 0.3 + maskColor.g * 0.59 +                        maskColor.b * 0.11;                                     }                                                               imageColor.a *= lum;                                            imageColor.rgb *= imageColor.a;                                 gl_FragColor = imageColor;                                    }                                                             ";
              var h = null;
              function p() {
                  var e, t;
                  c();
                  e = u;
                  u = null;
                  t = l;
                  l = null;
                  var n = r(t, f);
                  var a = i(t, d);
                  var o = s(t, [n, a]);
                  t.useProgram(o);
                  var p = {};
                  p.gl = t;
                  p.canvas = e;
                  p.resolutionLocation = t.getUniformLocation(o, "u_resolution");
                  p.positionLocation = t.getAttribLocation(o, "a_position");
                  p.backdropLocation = t.getUniformLocation(o, "u_backdrop");
                  p.subtypeLocation = t.getUniformLocation(o, "u_subtype");
                  var v = t.getAttribLocation(o, "a_texCoord");
                  var m = t.getUniformLocation(o, "u_image");
                  var g = t.getUniformLocation(o, "u_mask");
                  var b = t.createBuffer();
                  t.bindBuffer(t.ARRAY_BUFFER, b);
                  t.bufferData(t.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]), t.STATIC_DRAW);
                  t.enableVertexAttribArray(v);
                  t.vertexAttribPointer(v, 2, t.FLOAT, false, 0, 0);
                  t.uniform1i(m, 0);
                  t.uniform1i(g, 1);
                  h = p
              }
              function v(e, t, r) {
                  var n = e.width
                    , a = e.height;
                  if (!h) {
                      p()
                  }
                  var i = h
                    , s = i.canvas
                    , l = i.gl;
                  s.width = n;
                  s.height = a;
                  l.viewport(0, 0, l.drawingBufferWidth, l.drawingBufferHeight);
                  l.uniform2f(i.resolutionLocation, n, a);
                  if (r.backdrop) {
                      l.uniform4f(i.resolutionLocation, r.backdrop[0], r.backdrop[1], r.backdrop[2], 1)
                  } else {
                      l.uniform4f(i.resolutionLocation, 0, 0, 0, 0)
                  }
                  l.uniform1i(i.subtypeLocation, r.subtype === "Luminosity" ? 1 : 0);
                  var u = o(l, e, l.TEXTURE0);
                  var c = o(l, t, l.TEXTURE1);
                  var f = l.createBuffer();
                  l.bindBuffer(l.ARRAY_BUFFER, f);
                  l.bufferData(l.ARRAY_BUFFER, new Float32Array([0, 0, n, 0, 0, a, 0, a, n, 0, n, a]), l.STATIC_DRAW);
                  l.enableVertexAttribArray(i.positionLocation);
                  l.vertexAttribPointer(i.positionLocation, 2, l.FLOAT, false, 0, 0);
                  l.clearColor(0, 0, 0, 0);
                  l.enable(l.BLEND);
                  l.blendFunc(l.ONE, l.ONE_MINUS_SRC_ALPHA);
                  l.clear(l.COLOR_BUFFER_BIT);
                  l.drawArrays(l.TRIANGLES, 0, 6);
                  l.flush();
                  l.deleteTexture(u);
                  l.deleteTexture(c);
                  l.deleteBuffer(f);
                  return s
              }
              var m = "  attribute vec2 a_position;                                      attribute vec3 a_color;                                                                                                         uniform vec2 u_resolution;                                      uniform vec2 u_scale;                                           uniform vec2 u_offset;                                                                                                          varying vec4 v_color;                                                                                                           void main() {                                                     vec2 position = (a_position + u_offset) * u_scale;              vec2 clipSpace = (position / u_resolution) * 2.0 - 1.0;         gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);                                                                              v_color = vec4(a_color / 255.0, 1.0);                         }                                                             ";
              var g = "  precision mediump float;                                                                                                        varying vec4 v_color;                                                                                                           void main() {                                                     gl_FragColor = v_color;                                       }                                                             ";
              var b = null;
              function _() {
                  var e, t;
                  c();
                  e = u;
                  u = null;
                  t = l;
                  l = null;
                  var n = r(t, m);
                  var a = i(t, g);
                  var o = s(t, [n, a]);
                  t.useProgram(o);
                  var f = {};
                  f.gl = t;
                  f.canvas = e;
                  f.resolutionLocation = t.getUniformLocation(o, "u_resolution");
                  f.scaleLocation = t.getUniformLocation(o, "u_scale");
                  f.offsetLocation = t.getUniformLocation(o, "u_offset");
                  f.positionLocation = t.getAttribLocation(o, "a_position");
                  f.colorLocation = t.getAttribLocation(o, "a_color");
                  b = f
              }
              function y(e, t, r, n, a) {
                  if (!b) {
                      _()
                  }
                  var i = b
                    , s = i.canvas
                    , o = i.gl;
                  s.width = e;
                  s.height = t;
                  o.viewport(0, 0, o.drawingBufferWidth, o.drawingBufferHeight);
                  o.uniform2f(i.resolutionLocation, e, t);
                  var l = 0;
                  var u, c, f;
                  for (u = 0,
                  c = n.length; u < c; u++) {
                      switch (n[u].type) {
                      case "lattice":
                          f = n[u].coords.length / n[u].verticesPerRow | 0;
                          l += (f - 1) * (n[u].verticesPerRow - 1) * 6;
                          break;
                      case "triangles":
                          l += n[u].coords.length;
                          break
                      }
                  }
                  var d = new Float32Array(l * 2);
                  var h = new Uint8Array(l * 3);
                  var p = a.coords
                    , v = a.colors;
                  var m = 0
                    , g = 0;
                  for (u = 0,
                  c = n.length; u < c; u++) {
                      var y = n[u]
                        , A = y.coords
                        , S = y.colors;
                      switch (y.type) {
                      case "lattice":
                          var w = y.verticesPerRow;
                          f = A.length / w | 0;
                          for (var P = 1; P < f; P++) {
                              var C = P * w + 1;
                              for (var k = 1; k < w; k++,
                              C++) {
                                  d[m] = p[A[C - w - 1]];
                                  d[m + 1] = p[A[C - w - 1] + 1];
                                  d[m + 2] = p[A[C - w]];
                                  d[m + 3] = p[A[C - w] + 1];
                                  d[m + 4] = p[A[C - 1]];
                                  d[m + 5] = p[A[C - 1] + 1];
                                  h[g] = v[S[C - w - 1]];
                                  h[g + 1] = v[S[C - w - 1] + 1];
                                  h[g + 2] = v[S[C - w - 1] + 2];
                                  h[g + 3] = v[S[C - w]];
                                  h[g + 4] = v[S[C - w] + 1];
                                  h[g + 5] = v[S[C - w] + 2];
                                  h[g + 6] = v[S[C - 1]];
                                  h[g + 7] = v[S[C - 1] + 1];
                                  h[g + 8] = v[S[C - 1] + 2];
                                  d[m + 6] = d[m + 2];
                                  d[m + 7] = d[m + 3];
                                  d[m + 8] = d[m + 4];
                                  d[m + 9] = d[m + 5];
                                  d[m + 10] = p[A[C]];
                                  d[m + 11] = p[A[C] + 1];
                                  h[g + 9] = h[g + 3];
                                  h[g + 10] = h[g + 4];
                                  h[g + 11] = h[g + 5];
                                  h[g + 12] = h[g + 6];
                                  h[g + 13] = h[g + 7];
                                  h[g + 14] = h[g + 8];
                                  h[g + 15] = v[S[C]];
                                  h[g + 16] = v[S[C] + 1];
                                  h[g + 17] = v[S[C] + 2];
                                  m += 12;
                                  g += 18
                              }
                          }
                          break;
                      case "triangles":
                          for (var R = 0, x = A.length; R < x; R++) {
                              d[m] = p[A[R]];
                              d[m + 1] = p[A[R] + 1];
                              h[g] = v[S[R]];
                              h[g + 1] = v[S[R] + 1];
                              h[g + 2] = v[S[R] + 2];
                              m += 2;
                              g += 3
                          }
                          break
                      }
                  }
                  if (r) {
                      o.clearColor(r[0] / 255, r[1] / 255, r[2] / 255, 1)
                  } else {
                      o.clearColor(0, 0, 0, 0)
                  }
                  o.clear(o.COLOR_BUFFER_BIT);
                  var T = o.createBuffer();
                  o.bindBuffer(o.ARRAY_BUFFER, T);
                  o.bufferData(o.ARRAY_BUFFER, d, o.STATIC_DRAW);
                  o.enableVertexAttribArray(i.positionLocation);
                  o.vertexAttribPointer(i.positionLocation, 2, o.FLOAT, false, 0, 0);
                  var E = o.createBuffer();
                  o.bindBuffer(o.ARRAY_BUFFER, E);
                  o.bufferData(o.ARRAY_BUFFER, h, o.STATIC_DRAW);
                  o.enableVertexAttribArray(i.colorLocation);
                  o.vertexAttribPointer(i.colorLocation, 3, o.UNSIGNED_BYTE, false, 0, 0);
                  o.uniform2f(i.scaleLocation, a.scaleX, a.scaleY);
                  o.uniform2f(i.offsetLocation, a.offsetX, a.offsetY);
                  o.drawArrays(o.TRIANGLES, 0, l);
                  o.flush();
                  o.deleteBuffer(T);
                  o.deleteBuffer(E);
                  return s
              }
              function A() {
                  if (h && h.canvas) {
                      h.canvas.width = 0;
                      h.canvas.height = 0
                  }
                  if (b && b.canvas) {
                      b.canvas.width = 0;
                      b.canvas.height = 0
                  }
                  h = null;
                  b = null
              }
              return {
                  get isEnabled() {
                      if ((0,
                      n.getDefaultSetting)("disableWebGL")) {
                          return false
                      }
                      var e = false;
                      try {
                          c();
                          e = !!l
                      } catch (e) {}
                      return (0,
                      a.shadow)(this, "isEnabled", e)
                  },
                  composeSMask: v,
                  drawFigures: y,
                  clear: A
              }
          }();
          t.WebGLUtils = i
      }
      , function(e, t, r) {
          "use strict";
          Object.defineProperty(t, "__esModule", {
              value: true
          });
          t.PDFJS = t.isWorker = t.globalScope = undefined;
          var n = r(2);
          var a = r(1);
          var i = r(0);
          var s = r(3);
          var o = r(6);
          var l = r(5);
          var u = r(4);
          var c = typeof window === "undefined";
          if (!i.globalScope.PDFJS) {
              i.globalScope.PDFJS = {}
          }
          var f = i.globalScope.PDFJS;
          {
              f.version = "1.9.426";
              f.build = "2558a58d"
          }
          f.pdfBug = false;
          if (f.verbosity !== undefined) {
              (0,
              i.setVerbosityLevel)(f.verbosity)
          }
          delete f.verbosity;
          Object.defineProperty(f, "verbosity", {
              get: function e() {
                  return (0,
                  i.getVerbosityLevel)()
              },
              set: function e(t) {
                  (0,
                  i.setVerbosityLevel)(t)
              },
              enumerable: true,
              configurable: true
          });
          f.VERBOSITY_LEVELS = i.VERBOSITY_LEVELS;
          f.OPS = i.OPS;
          f.UNSUPPORTED_FEATURES = i.UNSUPPORTED_FEATURES;
          f.isValidUrl = a.isValidUrl;
          f.shadow = i.shadow;
          f.createBlob = i.createBlob;
          f.createObjectURL = function e(t, r) {
              return (0,
              i.createObjectURL)(t, r, f.disableCreateObjectURL)
          }
          ;
          Object.defineProperty(f, "isLittleEndian", {
              configurable: true,
              get: function e() {
                  return (0,
                  i.shadow)(f, "isLittleEndian", (0,
                  i.isLittleEndian)())
              }
          });
          f.removeNullCharacters = i.removeNullCharacters;
          f.PasswordResponses = i.PasswordResponses;
          f.PasswordException = i.PasswordException;
          f.UnknownErrorException = i.UnknownErrorException;
          f.InvalidPDFException = i.InvalidPDFException;
          f.MissingPDFException = i.MissingPDFException;
          f.UnexpectedResponseException = i.UnexpectedResponseException;
          f.Util = i.Util;
          f.PageViewport = i.PageViewport;
          f.createPromiseCapability = i.createPromiseCapability;
          f.maxImageSize = f.maxImageSize === undefined ? -1 : f.maxImageSize;
          f.cMapUrl = f.cMapUrl === undefined ? null : f.cMapUrl;
          f.cMapPacked = f.cMapPacked === undefined ? false : f.cMapPacked;
          f.disableFontFace = f.disableFontFace === undefined ? false : f.disableFontFace;
          f.imageResourcesPath = f.imageResourcesPath === undefined ? "" : f.imageResourcesPath;
          f.disableWorker = f.disableWorker === undefined ? false : f.disableWorker;
          f.workerSrc = f.workerSrc === undefined ? null : f.workerSrc;
          f.workerPort = f.workerPort === undefined ? null : f.workerPort;
          f.disableRange = f.disableRange === undefined ? false : f.disableRange;
          f.disableStream = f.disableStream === undefined ? false : f.disableStream;
          f.disableAutoFetch = f.disableAutoFetch === undefined ? false : f.disableAutoFetch;
          f.pdfBug = f.pdfBug === undefined ? false : f.pdfBug;
          f.postMessageTransfers = f.postMessageTransfers === undefined ? true : f.postMessageTransfers;
          f.disableCreateObjectURL = f.disableCreateObjectURL === undefined ? false : f.disableCreateObjectURL;
          f.disableWebGL = f.disableWebGL === undefined ? true : f.disableWebGL;
          f.externalLinkTarget = f.externalLinkTarget === undefined ? a.LinkTarget.NONE : f.externalLinkTarget;
          f.externalLinkRel = f.externalLinkRel === undefined ? a.DEFAULT_LINK_REL : f.externalLinkRel;
          f.isEvalSupported = f.isEvalSupported === undefined ? true : f.isEvalSupported;
          f.pdfjsNext = f.pdfjsNext === undefined ? false : f.pdfjsNext;
          {
              var d = f.openExternalLinksInNewWindow;
              delete f.openExternalLinksInNewWindow;
              Object.defineProperty(f, "openExternalLinksInNewWindow", {
                  get: function e() {
                      return f.externalLinkTarget === a.LinkTarget.BLANK
                  },
                  set: function e(t) {
                      if (t) {
                          (0,
                          i.deprecated)("PDFJS.openExternalLinksInNewWindow, please use " + '"PDFJS.externalLinkTarget = PDFJS.LinkTarget.BLANK" instead.')
                      }
                      if (f.externalLinkTarget !== a.LinkTarget.NONE) {
                          (0,
                          i.warn)("PDFJS.externalLinkTarget is already initialized");
                          return
                      }
                      f.externalLinkTarget = t ? a.LinkTarget.BLANK : a.LinkTarget.NONE
                  },
                  enumerable: true,
                  configurable: true
              });
              if (d) {
                  f.openExternalLinksInNewWindow = d
              }
          }
          f.getDocument = n.getDocument;
          f.LoopbackPort = n.LoopbackPort;
          f.PDFDataRangeTransport = n.PDFDataRangeTransport;
          f.PDFWorker = n.PDFWorker;
          f.hasCanvasTypedArrays = true;
          f.CustomStyle = a.CustomStyle;
          f.LinkTarget = a.LinkTarget;
          f.addLinkAttributes = a.addLinkAttributes;
          f.getFilenameFromUrl = a.getFilenameFromUrl;
          f.isExternalLinkTargetSet = a.isExternalLinkTargetSet;
          f.AnnotationLayer = s.AnnotationLayer;
          f.renderTextLayer = l.renderTextLayer;
          f.Metadata = o.Metadata;
          f.SVGGraphics = u.SVGGraphics;
          f.UnsupportedManager = n._UnsupportedManager;
          t.globalScope = i.globalScope;
          t.isWorker = c;
          t.PDFJS = f
      }
      , function(e, t, r) {
          "use strict";
          Object.defineProperty(t, "__esModule", {
              value: true
          });
          t.NetworkManager = t.PDFNetworkStream = undefined;
          var n = r(0);
          var a = r(2);
          var i = 200;
          var s = 206;
          function o(e, t) {
              this.url = e;
              t = t || {};
              this.isHttp = /^https?:/i.test(e);
              this.httpHeaders = this.isHttp && t.httpHeaders || {};
              this.withCredentials = t.withCredentials || false;
              this.getXhr = t.getXhr || function e() {
                  return new XMLHttpRequest
              }
              ;
              this.currXhrId = 0;
              this.pendingRequests = Object.create(null);
              this.loadedRequests = Object.create(null)
          }
          function l(e) {
              var t = e.response;
              if (typeof t !== "string") {
                  return t
              }
              var r = t.length;
              var n = new Uint8Array(r);
              for (var a = 0; a < r; a++) {
                  n[a] = t.charCodeAt(a) & 255
              }
              return n.buffer
          }
          var u = function e() {
              try {
                  var t = new XMLHttpRequest;
                  t.open("GET", n.globalScope.location.href);
                  t.responseType = "moz-chunked-arraybuffer";
                  return t.responseType === "moz-chunked-arraybuffer"
              } catch (e) {
                  return false
              }
          }();
          o.prototype = {
              requestRange: function e(t, r, n) {
                  var a = {
                      begin: t,
                      end: r
                  };
                  for (var i in n) {
                      a[i] = n[i]
                  }
                  return this.request(a)
              },
              requestFull: function e(t) {
                  return this.request(t)
              },
              request: function e(t) {
                  var r = this.getXhr();
                  var n = this.currXhrId++;
                  var a = this.pendingRequests[n] = {
                      xhr: r
                  };
                  r.open("GET", this.url);
                  r.withCredentials = this.withCredentials;
                  for (var i in this.httpHeaders) {
                      var s = this.httpHeaders[i];
                      if (typeof s === "undefined") {
                          continue
                      }
                      r.setRequestHeader(i, s)
                  }
                  if (this.isHttp && "begin"in t && "end"in t) {
                      var o = t.begin + "-" + (t.end - 1);
                      r.setRequestHeader("Range", "bytes=" + o);
                      a.expectedStatus = 206
                  } else {
                      a.expectedStatus = 200
                  }
                  var l = u && !!t.onProgressiveData;
                  if (l) {
                      r.responseType = "moz-chunked-arraybuffer";
                      a.onProgressiveData = t.onProgressiveData;
                      a.mozChunked = true
                  } else {
                      r.responseType = "arraybuffer"
                  }
                  if (t.onError) {
                      r.onerror = function(e) {
                          t.onError(r.status)
                      }
                  }
                  r.onreadystatechange = this.onStateChange.bind(this, n);
                  r.onprogress = this.onProgress.bind(this, n);
                  a.onHeadersReceived = t.onHeadersReceived;
                  a.onDone = t.onDone;
                  a.onError = t.onError;
                  a.onProgress = t.onProgress;
                  r.send(null);
                  return n
              },
              onProgress: function e(t, r) {
                  var n = this.pendingRequests[t];
                  if (!n) {
                      return
                  }
                  if (n.mozChunked) {
                      var a = l(n.xhr);
                      n.onProgressiveData(a)
                  }
                  var i = n.onProgress;
                  if (i) {
                      i(r)
                  }
              },
              onStateChange: function e(t, r) {
                  var n = this.pendingRequests[t];
                  if (!n) {
                      return
                  }
                  var a = n.xhr;
                  if (a.readyState >= 2 && n.onHeadersReceived) {
                      n.onHeadersReceived();
                      delete n.onHeadersReceived
                  }
                  if (a.readyState !== 4) {
                      return
                  }
                  if (!(t in this.pendingRequests)) {
                      return
                  }
                  delete this.pendingRequests[t];
                  if (a.status === 0 && this.isHttp) {
                      if (n.onError) {
                          n.onError(a.status)
                      }
                      return
                  }
                  var o = a.status || i;
                  var u = o === i && n.expectedStatus === s;
                  if (!u && o !== n.expectedStatus) {
                      if (n.onError) {
                          n.onError(a.status)
                      }
                      return
                  }
                  this.loadedRequests[t] = true;
                  var c = l(a);
                  if (o === s) {
                      var f = a.getResponseHeader("Content-Range");
                      var d = /bytes (\d+)-(\d+)\/(\d+)/.exec(f);
                      var h = parseInt(d[1], 10);
                      n.onDone({
                          begin: h,
                          chunk: c
                      })
                  } else if (n.onProgressiveData) {
                      n.onDone(null)
                  } else if (c) {
                      n.onDone({
                          begin: 0,
                          chunk: c
                      })
                  } else if (n.onError) {
                      n.onError(a.status)
                  }
              },
              hasPendingRequests: function e() {
                  for (var t in this.pendingRequests) {
                      return true
                  }
                  return false
              },
              getRequestXhr: function e(t) {
                  return this.pendingRequests[t].xhr
              },
              isStreamingRequest: function e(t) {
                  return !!this.pendingRequests[t].onProgressiveData
              },
              isPendingRequest: function e(t) {
                  return t in this.pendingRequests
              },
              isLoadedRequest: function e(t) {
                  return t in this.loadedRequests
              },
              abortAllRequests: function e() {
                  for (var t in this.pendingRequests) {
                      this.abortRequest(t | 0)
                  }
              },
              abortRequest: function e(t) {
                  var r = this.pendingRequests[t].xhr;
                  delete this.pendingRequests[t];
                  r.abort()
              }
          };
          function c(e) {
              this._options = e;
              var t = e.source;
              this._manager = new o(t.url,{
                  httpHeaders: t.httpHeaders,
                  withCredentials: t.withCredentials
              });
              this._rangeChunkSize = t.rangeChunkSize;
              this._fullRequestReader = null;
              this._rangeRequestReaders = []
          }
          c.prototype = {
              _onRangeRequestReaderClosed: function e(t) {
                  var r = this._rangeRequestReaders.indexOf(t);
                  if (r >= 0) {
                      this._rangeRequestReaders.splice(r, 1)
                  }
              },
              getFullReader: function e() {
                  (0,
                  n.assert)(!this._fullRequestReader);
                  this._fullRequestReader = new f(this._manager,this._options);
                  return this._fullRequestReader
              },
              getRangeReader: function e(t, r) {
                  var n = new d(this._manager,t,r);
                  n.onClosed = this._onRangeRequestReaderClosed.bind(this);
                  this._rangeRequestReaders.push(n);
                  return n
              },
              cancelAllRequests: function e(t) {
                  if (this._fullRequestReader) {
                      this._fullRequestReader.cancel(t)
                  }
                  var r = this._rangeRequestReaders.slice(0);
                  r.forEach(function(e) {
                      e.cancel(t)
                  })
              }
          };
          function f(e, t) {
              this._manager = e;
              var r = t.source;
              var a = {
                  onHeadersReceived: this._onHeadersReceived.bind(this),
                  onProgressiveData: r.disableStream ? null : this._onProgressiveData.bind(this),
                  onDone: this._onDone.bind(this),
                  onError: this._onError.bind(this),
                  onProgress: this._onProgress.bind(this)
              };
              this._url = r.url;
              this._fullRequestId = e.requestFull(a);
              this._headersReceivedCapability = (0,
              n.createPromiseCapability)();
              this._disableRange = t.disableRange || false;
              this._contentLength = r.length;
              this._rangeChunkSize = r.rangeChunkSize;
              if (!this._rangeChunkSize && !this._disableRange) {
                  this._disableRange = true
              }
              this._isStreamingSupported = false;
              this._isRangeSupported = false;
              this._cachedChunks = [];
              this._requests = [];
              this._done = false;
              this._storedError = undefined;
              this.onProgress = null
          }
          f.prototype = {
              _validateRangeRequestCapabilities: function e() {
                  if (this._disableRange) {
                      return false
                  }
                  var t = this._manager;
                  if (!t.isHttp) {
                      return false
                  }
                  var r = this._fullRequestId;
                  var a = t.getRequestXhr(r);
                  if (a.getResponseHeader("Accept-Ranges") !== "bytes") {
                      return false
                  }
                  var i = a.getResponseHeader("Content-Encoding") || "identity";
                  if (i !== "identity") {
                      return false
                  }
                  var s = a.getResponseHeader("Content-Length");
                  s = parseInt(s, 10);
                  if (!(0,
                  n.isInt)(s)) {
                      return false
                  }
                  this._contentLength = s;
                  if (s <= 2 * this._rangeChunkSize) {
                      return false
                  }
                  return true
              },
              _onHeadersReceived: function e() {
                  if (this._validateRangeRequestCapabilities()) {
                      this._isRangeSupported = true
                  }
                  var t = this._manager;
                  var r = this._fullRequestId;
                  if (t.isStreamingRequest(r)) {
                      this._isStreamingSupported = true
                  } else if (this._isRangeSupported) {
                      t.abortRequest(r)
                  }
                  this._headersReceivedCapability.resolve()
              },
              _onProgressiveData: function e(t) {
                  if (this._requests.length > 0) {
                      var r = this._requests.shift();
                      r.resolve({
                          value: t,
                          done: false
                      })
                  } else {
                      this._cachedChunks.push(t)
                  }
              },
              _onDone: function e(t) {
                  if (t) {
                      this._onProgressiveData(t.chunk)
                  }
                  this._done = true;
                  if (this._cachedChunks.length > 0) {
                      return
                  }
                  this._requests.forEach(function(e) {
                      e.resolve({
                          value: undefined,
                          done: true
                      })
                  });
                  this._requests = []
              },
              _onError: function e(t) {
                  var r = this._url;
                  var a;
                  if (t === 404 || t === 0 && /^file:/.test(r)) {
                      a = new n.MissingPDFException('Missing PDF "' + r + '".')
                  } else {
                      a = new n.UnexpectedResponseException("Unexpected server response (" + t + ') while retrieving PDF "' + r + '".',t)
                  }
                  this._storedError = a;
                  this._headersReceivedCapability.reject(a);
                  this._requests.forEach(function(e) {
                      e.reject(a)
                  });
                  this._requests = [];
                  this._cachedChunks = []
              },
              _onProgress: function e(t) {
                  if (this.onProgress) {
                      this.onProgress({
                          loaded: t.loaded,
                          total: t.lengthComputable ? t.total : this._contentLength
                      })
                  }
              },
              get isRangeSupported() {
                  return this._isRangeSupported
              },
              get isStreamingSupported() {
                  return this._isStreamingSupported
              },
              get contentLength() {
                  return this._contentLength
              },
              get headersReady() {
                  return this._headersReceivedCapability.promise
              },
              read: function e() {
                  if (this._storedError) {
                      return Promise.reject(this._storedError)
                  }
                  if (this._cachedChunks.length > 0) {
                      var t = this._cachedChunks.shift();
                      return Promise.resolve({
                          value: t,
                          done: false
                      })
                  }
                  if (this._done) {
                      return Promise.resolve({
                          value: undefined,
                          done: true
                      })
                  }
                  var r = (0,
                  n.createPromiseCapability)();
                  this._requests.push(r);
                  return r.promise
              },
              cancel: function e(t) {
                  this._done = true;
                  this._headersReceivedCapability.reject(t);
                  this._requests.forEach(function(e) {
                      e.resolve({
                          value: undefined,
                          done: true
                      })
                  });
                  this._requests = [];
                  if (this._manager.isPendingRequest(this._fullRequestId)) {
                      this._manager.abortRequest(this._fullRequestId)
                  }
                  this._fullRequestReader = null
              }
          };
          function d(e, t, r) {
              this._manager = e;
              var n = {
                  onDone: this._onDone.bind(this),
                  onProgress: this._onProgress.bind(this)
              };
              this._requestId = e.requestRange(t, r, n);
              this._requests = [];
              this._queuedChunk = null;
              this._done = false;
              this.onProgress = null;
              this.onClosed = null
          }
          d.prototype = {
              _close: function e() {
                  if (this.onClosed) {
                      this.onClosed(this)
                  }
              },
              _onDone: function e(t) {
                  var r = t.chunk;
                  if (this._requests.length > 0) {
                      var n = this._requests.shift();
                      n.resolve({
                          value: r,
                          done: false
                      })
                  } else {
                      this._queuedChunk = r
                  }
                  this._done = true;
                  this._requests.forEach(function(e) {
                      e.resolve({
                          value: undefined,
                          done: true
                      })
                  });
                  this._requests = [];
                  this._close()
              },
              _onProgress: function e(t) {
                  if (!this.isStreamingSupported && this.onProgress) {
                      this.onProgress({
                          loaded: t.loaded
                      })
                  }
              },
              get isStreamingSupported() {
                  return false
              },
              read: function e() {
                  if (this._queuedChunk !== null) {
                      var t = this._queuedChunk;
                      this._queuedChunk = null;
                      return Promise.resolve({
                          value: t,
                          done: false
                      })
                  }
                  if (this._done) {
                      return Promise.resolve({
                          value: undefined,
                          done: true
                      })
                  }
                  var r = (0,
                  n.createPromiseCapability)();
                  this._requests.push(r);
                  return r.promise
              },
              cancel: function e(t) {
                  this._done = true;
                  this._requests.forEach(function(e) {
                      e.resolve({
                          value: undefined,
                          done: true
                      })
                  });
                  this._requests = [];
                  if (this._manager.isPendingRequest(this._requestId)) {
                      this._manager.abortRequest(this._requestId)
                  }
                  this._close()
              }
          };
          (0,
          a.setPDFNetworkStreamClass)(c);
          t.PDFNetworkStream = c;
          t.NetworkManager = o
      }
      , function(e, t, r) {
          "use strict";
          var n = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(e) {
              return typeof e
          }
          : function(e) {
              return e && typeof Symbol === "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
          }
          ;
          (function(e, t) {
              for (var r in t) {
                  e[r] = t[r]
              }
          }
          )(t, function(e) {
              var t = {};
              function r(n) {
                  if (t[n])
                      return t[n].exports;
                  var a = t[n] = {
                      i: n,
                      l: false,
                      exports: {}
                  };
                  e[n].call(a.exports, a, a.exports, r);
                  a.l = true;
                  return a.exports
              }
              r.m = e;
              r.c = t;
              r.i = function(e) {
                  return e
              }
              ;
              r.d = function(e, t, n) {
                  if (!r.o(e, t)) {
                      Object.defineProperty(e, t, {
                          configurable: false,
                          enumerable: true,
                          get: n
                      })
                  }
              }
              ;
              r.n = function(e) {
                  var t = e && e.__esModule ? function t() {
                      return e["default"]
                  }
                  : function t() {
                      return e
                  }
                  ;
                  r.d(t, "a", t);
                  return t
              }
              ;
              r.o = function(e, t) {
                  return Object.prototype.hasOwnProperty.call(e, t)
              }
              ;
              r.p = "";
              return r(r.s = 7)
          }([function(e, t, r) {
              "use strict";
              var a = typeof Symbol === "function" && n(Symbol.iterator) === "symbol" ? function(e) {
                  return typeof e === "undefined" ? "undefined" : n(e)
              }
              : function(e) {
                  return e && typeof Symbol === "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e === "undefined" ? "undefined" : n(e)
              }
              ;
              var i = r(1)
                , s = i.assert;
              function o(e) {
                  return typeof e === "string" || (typeof e === "undefined" ? "undefined" : a(e)) === "symbol"
              }
              t.typeIsObject = function(e) {
                  return (typeof e === "undefined" ? "undefined" : a(e)) === "object" && e !== null || typeof e === "function"
              }
              ;
              t.createDataProperty = function(e, r, n) {
                  s(t.typeIsObject(e));
                  Object.defineProperty(e, r, {
                      value: n,
                      writable: true,
                      enumerable: true,
                      configurable: true
                  })
              }
              ;
              t.createArrayFromList = function(e) {
                  return e.slice()
              }
              ;
              t.ArrayBufferCopy = function(e, t, r, n, a) {
                  new Uint8Array(e).set(new Uint8Array(r,n,a), t)
              }
              ;
              t.CreateIterResultObject = function(e, t) {
                  s(typeof t === "boolean");
                  var r = {};
                  Object.defineProperty(r, "value", {
                      value: e,
                      enumerable: true,
                      writable: true,
                      configurable: true
                  });
                  Object.defineProperty(r, "done", {
                      value: t,
                      enumerable: true,
                      writable: true,
                      configurable: true
                  });
                  return r
              }
              ;
              t.IsFiniteNonNegativeNumber = function(e) {
                  if (Number.isNaN(e)) {
                      return false
                  }
                  if (e === Infinity) {
                      return false
                  }
                  if (e < 0) {
                      return false
                  }
                  return true
              }
              ;
              function l(e, t, r) {
                  if (typeof e !== "function") {
                      throw new TypeError("Argument is not a function")
                  }
                  return Function.prototype.apply.call(e, t, r)
              }
              t.InvokeOrNoop = function(e, t, r) {
                  s(e !== undefined);
                  s(o(t));
                  s(Array.isArray(r));
                  var n = e[t];
                  if (n === undefined) {
                      return undefined
                  }
                  return l(n, e, r)
              }
              ;
              t.PromiseInvokeOrNoop = function(e, r, n) {
                  s(e !== undefined);
                  s(o(r));
                  s(Array.isArray(n));
                  try {
                      return Promise.resolve(t.InvokeOrNoop(e, r, n))
                  } catch (e) {
                      return Promise.reject(e)
                  }
              }
              ;
              t.PromiseInvokeOrPerformFallback = function(e, t, r, n, a) {
                  s(e !== undefined);
                  s(o(t));
                  s(Array.isArray(r));
                  s(Array.isArray(a));
                  var i = void 0;
                  try {
                      i = e[t]
                  } catch (e) {
                      return Promise.reject(e)
                  }
                  if (i === undefined) {
                      return n.apply(null, a)
                  }
                  try {
                      return Promise.resolve(l(i, e, r))
                  } catch (e) {
                      return Promise.reject(e)
                  }
              }
              ;
              t.TransferArrayBuffer = function(e) {
                  return e.slice()
              }
              ;
              t.ValidateAndNormalizeHighWaterMark = function(e) {
                  e = Number(e);
                  if (Number.isNaN(e) || e < 0) {
                      throw new RangeError("highWaterMark property of a queuing strategy must be non-negative and non-NaN")
                  }
                  return e
              }
              ;
              t.ValidateAndNormalizeQueuingStrategy = function(e, r) {
                  if (e !== undefined && typeof e !== "function") {
                      throw new TypeError("size property of a queuing strategy must be a function")
                  }
                  r = t.ValidateAndNormalizeHighWaterMark(r);
                  return {
                      size: e,
                      highWaterMark: r
                  }
              }
          }
          , function(e, t, r) {
              "use strict";
              function n(e) {
                  if (e && e.constructor === a) {
                      setTimeout(function() {
                          throw e
                      }, 0)
                  }
              }
              function a(e) {
                  this.name = "AssertionError";
                  this.message = e || "";
                  this.stack = (new Error).stack
              }
              a.prototype = Object.create(Error.prototype);
              a.prototype.constructor = a;
              function i(e, t) {
                  if (!e) {
                      throw new a(t)
                  }
              }
              e.exports = {
                  rethrowAssertionErrorRejection: n,
                  AssertionError: a,
                  assert: i
              }
          }
          , function(e, t, r) {
              "use strict";
              var n = function() {
                  function e(e, t) {
                      for (var r = 0; r < t.length; r++) {
                          var n = t[r];
                          n.enumerable = n.enumerable || false;
                          n.configurable = true;
                          if ("value"in n)
                              n.writable = true;
                          Object.defineProperty(e, n.key, n)
                      }
                  }
                  return function(t, r, n) {
                      if (r)
                          e(t.prototype, r);
                      if (n)
                          e(t, n);
                      return t
                  }
              }();
              function a(e, t) {
                  if (!(e instanceof t)) {
                      throw new TypeError("Cannot call a class as a function")
                  }
              }
              var i = r(0)
                , s = i.InvokeOrNoop
                , o = i.PromiseInvokeOrNoop
                , l = i.ValidateAndNormalizeQueuingStrategy
                , u = i.typeIsObject;
              var c = r(1)
                , f = c.assert
                , d = c.rethrowAssertionErrorRejection;
              var h = r(3)
                , p = h.DequeueValue
                , v = h.EnqueueValueWithSize
                , m = h.PeekQueueValue
                , g = h.ResetQueue;
              var b = function() {
                  function e() {
                      var t = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
                      var r = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {}
                        , n = r.size
                        , i = r.highWaterMark
                        , s = i === undefined ? 1 : i;
                      a(this, e);
                      this._state = "writable";
                      this._storedError = undefined;
                      this._writer = undefined;
                      this._writableStreamController = undefined;
                      this._writeRequests = [];
                      this._inFlightWriteRequest = undefined;
                      this._closeRequest = undefined;
                      this._inFlightCloseRequest = undefined;
                      this._pendingAbortRequest = undefined;
                      this._backpressure = false;
                      var o = t.type;
                      if (o !== undefined) {
                          throw new RangeError("Invalid type is specified")
                      }
                      this._writableStreamController = new Y(this,t,n,s);
                      this._writableStreamController.__startSteps()
                  }
                  n(e, [{
                      key: "abort",
                      value: function e(t) {
                          if (y(this) === false) {
                              return Promise.reject(ie("abort"))
                          }
                          if (A(this) === true) {
                              return Promise.reject(new TypeError("Cannot abort a stream that already has a writer"))
                          }
                          return S(this, t)
                      }
                  }, {
                      key: "getWriter",
                      value: function e() {
                          if (y(this) === false) {
                              throw ie("getWriter")
                          }
                          return _(this)
                      }
                  }, {
                      key: "locked",
                      get: function e() {
                          if (y(this) === false) {
                              throw ie("locked")
                          }
                          return A(this)
                      }
                  }]);
                  return e
              }();
              e.exports = {
                  AcquireWritableStreamDefaultWriter: _,
                  IsWritableStream: y,
                  IsWritableStreamLocked: A,
                  WritableStream: b,
                  WritableStreamAbort: S,
                  WritableStreamDefaultControllerError: ae,
                  WritableStreamDefaultWriterCloseWithErrorPropagation: W,
                  WritableStreamDefaultWriterRelease: H,
                  WritableStreamDefaultWriterWrite: X,
                  WritableStreamCloseQueuedOrInFlight: I
              };
              function _(e) {
                  return new N(e)
              }
              function y(e) {
                  if (!u(e)) {
                      return false
                  }
                  if (!Object.prototype.hasOwnProperty.call(e, "_writableStreamController")) {
                      return false
                  }
                  return true
              }
              function A(e) {
                  f(y(e) === true, "IsWritableStreamLocked should only be used on known writable streams");
                  if (e._writer === undefined) {
                      return false
                  }
                  return true
              }
              function S(e, t) {
                  var r = e._state;
                  if (r === "closed") {
                      return Promise.resolve(undefined)
                  }
                  if (r === "errored") {
                      return Promise.reject(e._storedError)
                  }
                  var n = new TypeError("Requested to abort");
                  if (e._pendingAbortRequest !== undefined) {
                      return Promise.reject(n)
                  }
                  f(r === "writable" || r === "erroring", "state must be writable or erroring");
                  var a = false;
                  if (r === "erroring") {
                      a = true;
                      t = undefined
                  }
                  var i = new Promise(function(r, n) {
                      e._pendingAbortRequest = {
                          _resolve: r,
                          _reject: n,
                          _reason: t,
                          _wasAlreadyErroring: a
                      }
                  }
                  );
                  if (a === false) {
                      C(e, n)
                  }
                  return i
              }
              function w(e) {
                  f(A(e) === true);
                  f(e._state === "writable");
                  var t = new Promise(function(t, r) {
                      var n = {
                          _resolve: t,
                          _reject: r
                      };
                      e._writeRequests.push(n)
                  }
                  );
                  return t
              }
              function P(e, t) {
                  var r = e._state;
                  if (r === "writable") {
                      C(e, t);
                      return
                  }
                  f(r === "erroring");
                  k(e)
              }
              function C(e, t) {
                  f(e._storedError === undefined, "stream._storedError === undefined");
                  f(e._state === "writable", "state must be writable");
                  var r = e._writableStreamController;
                  f(r !== undefined, "controller must not be undefined");
                  e._state = "erroring";
                  e._storedError = t;
                  var n = e._writer;
                  if (n !== undefined) {
                      z(n, t)
                  }
                  if (L(e) === false && r._started === true) {
                      k(e)
                  }
              }
              function k(e) {
                  f(e._state === "erroring", "stream._state === erroring");
                  f(L(e) === false, "WritableStreamHasOperationMarkedInFlight(stream) === false");
                  e._state = "errored";
                  e._writableStreamController.__errorSteps();
                  var t = e._storedError;
                  for (var r = 0; r < e._writeRequests.length; r++) {
                      var n = e._writeRequests[r];
                      n._reject(t)
                  }
                  e._writeRequests = [];
                  if (e._pendingAbortRequest === undefined) {
                      D(e);
                      return
                  }
                  var a = e._pendingAbortRequest;
                  e._pendingAbortRequest = undefined;
                  if (a._wasAlreadyErroring === true) {
                      a._reject(t);
                      D(e);
                      return
                  }
                  var i = e._writableStreamController.__abortSteps(a._reason);
                  i.then(function() {
                      a._resolve();
                      D(e)
                  }, function(t) {
                      a._reject(t);
                      D(e)
                  })
              }
              function R(e) {
                  f(e._inFlightWriteRequest !== undefined);
                  e._inFlightWriteRequest._resolve(undefined);
                  e._inFlightWriteRequest = undefined
              }
              function x(e, t) {
                  f(e._inFlightWriteRequest !== undefined);
                  e._inFlightWriteRequest._reject(t);
                  e._inFlightWriteRequest = undefined;
                  f(e._state === "writable" || e._state === "erroring");
                  P(e, t)
              }
              function T(e) {
                  f(e._inFlightCloseRequest !== undefined);
                  e._inFlightCloseRequest._resolve(undefined);
                  e._inFlightCloseRequest = undefined;
                  var t = e._state;
                  f(t === "writable" || t === "erroring");
                  if (t === "erroring") {
                      e._storedError = undefined;
                      if (e._pendingAbortRequest !== undefined) {
                          e._pendingAbortRequest._resolve();
                          e._pendingAbortRequest = undefined
                      }
                  }
                  e._state = "closed";
                  var r = e._writer;
                  if (r !== undefined) {
                      he(r)
                  }
                  f(e._pendingAbortRequest === undefined, "stream._pendingAbortRequest === undefined");
                  f(e._storedError === undefined, "stream._storedError === undefined")
              }
              function E(e, t) {
                  f(e._inFlightCloseRequest !== undefined);
                  e._inFlightCloseRequest._reject(t);
                  e._inFlightCloseRequest = undefined;
                  f(e._state === "writable" || e._state === "erroring");
                  if (e._pendingAbortRequest !== undefined) {
                      e._pendingAbortRequest._reject(t);
                      e._pendingAbortRequest = undefined
                  }
                  P(e, t)
              }
              function I(e) {
                  if (e._closeRequest === undefined && e._inFlightCloseRequest === undefined) {
                      return false
                  }
                  return true
              }
              function L(e) {
                  if (e._inFlightWriteRequest === undefined && e._inFlightCloseRequest === undefined) {
                      return false
                  }
                  return true
              }
              function O(e) {
                  f(e._inFlightCloseRequest === undefined);
                  f(e._closeRequest !== undefined);
                  e._inFlightCloseRequest = e._closeRequest;
                  e._closeRequest = undefined
              }
              function j(e) {
                  f(e._inFlightWriteRequest === undefined, "there must be no pending write request");
                  f(e._writeRequests.length !== 0, "writeRequests must not be empty");
                  e._inFlightWriteRequest = e._writeRequests.shift()
              }
              function D(e) {
                  f(e._state === "errored", '_stream_.[[state]] is `"errored"`');
                  if (e._closeRequest !== undefined) {
                      f(e._inFlightCloseRequest === undefined);
                      e._closeRequest._reject(e._storedError);
                      e._closeRequest = undefined
                  }
                  var t = e._writer;
                  if (t !== undefined) {
                      fe(t, e._storedError);
                      t._closedPromise.catch(function() {})
                  }
              }
              function F(e, t) {
                  f(e._state === "writable");
                  f(I(e) === false);
                  var r = e._writer;
                  if (r !== undefined && t !== e._backpressure) {
                      if (t === true) {
                          be(r)
                      } else {
                          f(t === false);
                          ye(r)
                      }
                  }
                  e._backpressure = t
              }
              var N = function() {
                  function e(t) {
                      a(this, e);
                      if (y(t) === false) {
                          throw new TypeError("WritableStreamDefaultWriter can only be constructed with a WritableStream instance")
                      }
                      if (A(t) === true) {
                          throw new TypeError("This stream has already been locked for exclusive writing by another writer")
                      }
                      this._ownerWritableStream = t;
                      t._writer = this;
                      var r = t._state;
                      if (r === "writable") {
                          if (I(t) === false && t._backpressure === true) {
                              pe(this)
                          } else {
                              me(this)
                          }
                          le(this)
                      } else if (r === "erroring") {
                          ve(this, t._storedError);
                          this._readyPromise.catch(function() {});
                          le(this)
                      } else if (r === "closed") {
                          me(this);
                          ce(this)
                      } else {
                          f(r === "errored", "state must be errored");
                          var n = t._storedError;
                          ve(this, n);
                          this._readyPromise.catch(function() {});
                          ue(this, n);
                          this._closedPromise.catch(function() {})
                      }
                  }
                  n(e, [{
                      key: "abort",
                      value: function e(t) {
                          if (M(this) === false) {
                              return Promise.reject(se("abort"))
                          }
                          if (this._ownerWritableStream === undefined) {
                              return Promise.reject(oe("abort"))
                          }
                          return q(this, t)
                      }
                  }, {
                      key: "close",
                      value: function e() {
                          if (M(this) === false) {
                              return Promise.reject(se("close"))
                          }
                          var t = this._ownerWritableStream;
                          if (t === undefined) {
                              return Promise.reject(oe("close"))
                          }
                          if (I(t) === true) {
                              return Promise.reject(new TypeError("cannot close an already-closing stream"))
                          }
                          return U(this)
                      }
                  }, {
                      key: "releaseLock",
                      value: function e() {
                          if (M(this) === false) {
                              throw se("releaseLock")
                          }
                          var t = this._ownerWritableStream;
                          if (t === undefined) {
                              return
                          }
                          f(t._writer !== undefined);
                          H(this)
                      }
                  }, {
                      key: "write",
                      value: function e(t) {
                          if (M(this) === false) {
                              return Promise.reject(se("write"))
                          }
                          if (this._ownerWritableStream === undefined) {
                              return Promise.reject(oe("write to"))
                          }
                          return X(this, t)
                      }
                  }, {
                      key: "closed",
                      get: function e() {
                          if (M(this) === false) {
                              return Promise.reject(se("closed"))
                          }
                          return this._closedPromise
                      }
                  }, {
                      key: "desiredSize",
                      get: function e() {
                          if (M(this) === false) {
                              throw se("desiredSize")
                          }
                          if (this._ownerWritableStream === undefined) {
                              throw oe("desiredSize")
                          }
                          return G(this)
                      }
                  }, {
                      key: "ready",
                      get: function e() {
                          if (M(this) === false) {
                              return Promise.reject(se("ready"))
                          }
                          return this._readyPromise
                      }
                  }]);
                  return e
              }();
              function M(e) {
                  if (!u(e)) {
                      return false
                  }
                  if (!Object.prototype.hasOwnProperty.call(e, "_ownerWritableStream")) {
                      return false
                  }
                  return true
              }
              function q(e, t) {
                  var r = e._ownerWritableStream;
                  f(r !== undefined);
                  return S(r, t)
              }
              function U(e) {
                  var t = e._ownerWritableStream;
                  f(t !== undefined);
                  var r = t._state;
                  if (r === "closed" || r === "errored") {
                      return Promise.reject(new TypeError("The stream (in " + r + " state) is not in the writable state and cannot be closed"))
                  }
                  f(r === "writable" || r === "erroring");
                  f(I(t) === false);
                  var n = new Promise(function(e, r) {
                      var n = {
                          _resolve: e,
                          _reject: r
                      };
                      t._closeRequest = n
                  }
                  );
                  if (t._backpressure === true && r === "writable") {
                      ye(e)
                  }
                  V(t._writableStreamController);
                  return n
              }
              function W(e) {
                  var t = e._ownerWritableStream;
                  f(t !== undefined);
                  var r = t._state;
                  if (I(t) === true || r === "closed") {
                      return Promise.resolve()
                  }
                  if (r === "errored") {
                      return Promise.reject(t._storedError)
                  }
                  f(r === "writable" || r === "erroring");
                  return U(e)
              }
              function B(e, t) {
                  if (e._closedPromiseState === "pending") {
                      fe(e, t)
                  } else {
                      de(e, t)
                  }
                  e._closedPromise.catch(function() {})
              }
              function z(e, t) {
                  if (e._readyPromiseState === "pending") {
                      ge(e, t)
                  } else {
                      _e(e, t)
                  }
                  e._readyPromise.catch(function() {})
              }
              function G(e) {
                  var t = e._ownerWritableStream;
                  var r = t._state;
                  if (r === "errored" || r === "erroring") {
                      return null
                  }
                  if (r === "closed") {
                      return 0
                  }
                  return Q(t._writableStreamController)
              }
              function H(e) {
                  var t = e._ownerWritableStream;
                  f(t !== undefined);
                  f(t._writer === e);
                  var r = new TypeError("Writer was released and can no longer be used to monitor the stream's closedness");
                  z(e, r);
                  B(e, r);
                  t._writer = undefined;
                  e._ownerWritableStream = undefined
              }
              function X(e, t) {
                  var r = e._ownerWritableStream;
                  f(r !== undefined);
                  var n = r._writableStreamController;
                  var a = J(n, t);
                  if (r !== e._ownerWritableStream) {
                      return Promise.reject(oe("write to"))
                  }
                  var i = r._state;
                  if (i === "errored") {
                      return Promise.reject(r._storedError)
                  }
                  if (I(r) === true || i === "closed") {
                      return Promise.reject(new TypeError("The stream is closing or closed and cannot be written to"))
                  }
                  if (i === "erroring") {
                      return Promise.reject(r._storedError)
                  }
                  f(i === "writable");
                  var s = w(r);
                  K(n, t, a);
                  return s
              }
              var Y = function() {
                  function e(t, r, n, i) {
                      a(this, e);
                      if (y(t) === false) {
                          throw new TypeError("WritableStreamDefaultController can only be constructed with a WritableStream instance")
                      }
                      if (t._writableStreamController !== undefined) {
                          throw new TypeError("WritableStreamDefaultController instances can only be created by the WritableStream constructor")
                      }
                      this._controlledWritableStream = t;
                      this._underlyingSink = r;
                      this._queue = undefined;
                      this._queueTotalSize = undefined;
                      g(this);
                      this._started = false;
                      var s = l(n, i);
                      this._strategySize = s.size;
                      this._strategyHWM = s.highWaterMark;
                      var o = ne(this);
                      F(t, o)
                  }
                  n(e, [{
                      key: "error",
                      value: function e(t) {
                          if (Z(this) === false) {
                              throw new TypeError("WritableStreamDefaultController.prototype.error can only be used on a WritableStreamDefaultController")
                          }
                          var r = this._controlledWritableStream._state;
                          if (r !== "writable") {
                              return
                          }
                          ae(this, t)
                      }
                  }, {
                      key: "__abortSteps",
                      value: function e(t) {
                          return o(this._underlyingSink, "abort", [t])
                      }
                  }, {
                      key: "__errorSteps",
                      value: function e() {
                          g(this)
                      }
                  }, {
                      key: "__startSteps",
                      value: function e() {
                          var t = this;
                          var r = s(this._underlyingSink, "start", [this]);
                          var n = this._controlledWritableStream;
                          Promise.resolve(r).then(function() {
                              f(n._state === "writable" || n._state === "erroring");
                              t._started = true;
                              $(t)
                          }, function(e) {
                              f(n._state === "writable" || n._state === "erroring");
                              t._started = true;
                              P(n, e)
                          }).catch(d)
                      }
                  }]);
                  return e
              }();
              function V(e) {
                  v(e, "close", 0);
                  $(e)
              }
              function J(e, t) {
                  var r = e._strategySize;
                  if (r === undefined) {
                      return 1
                  }
                  try {
                      return r(t)
                  } catch (t) {
                      ee(e, t);
                      return 1
                  }
              }
              function Q(e) {
                  return e._strategyHWM - e._queueTotalSize
              }
              function K(e, t, r) {
                  var n = {
                      chunk: t
                  };
                  try {
                      v(e, n, r)
                  } catch (t) {
                      ee(e, t);
                      return
                  }
                  var a = e._controlledWritableStream;
                  if (I(a) === false && a._state === "writable") {
                      var i = ne(e);
                      F(a, i)
                  }
                  $(e)
              }
              function Z(e) {
                  if (!u(e)) {
                      return false
                  }
                  if (!Object.prototype.hasOwnProperty.call(e, "_underlyingSink")) {
                      return false
                  }
                  return true
              }
              function $(e) {
                  var t = e._controlledWritableStream;
                  if (e._started === false) {
                      return
                  }
                  if (t._inFlightWriteRequest !== undefined) {
                      return
                  }
                  var r = t._state;
                  if (r === "closed" || r === "errored") {
                      return
                  }
                  if (r === "erroring") {
                      k(t);
                      return
                  }
                  if (e._queue.length === 0) {
                      return
                  }
                  var n = m(e);
                  if (n === "close") {
                      te(e)
                  } else {
                      re(e, n.chunk)
                  }
              }
              function ee(e, t) {
                  if (e._controlledWritableStream._state === "writable") {
                      ae(e, t)
                  }
              }
              function te(e) {
                  var t = e._controlledWritableStream;
                  O(t);
                  p(e);
                  f(e._queue.length === 0, "queue must be empty once the final write record is dequeued");
                  var r = o(e._underlyingSink, "close", []);
                  r.then(function() {
                      T(t)
                  }, function(e) {
                      E(t, e)
                  }).catch(d)
              }
              function re(e, t) {
                  var r = e._controlledWritableStream;
                  j(r);
                  var n = o(e._underlyingSink, "write", [t, e]);
                  n.then(function() {
                      R(r);
                      var t = r._state;
                      f(t === "writable" || t === "erroring");
                      p(e);
                      if (I(r) === false && t === "writable") {
                          var n = ne(e);
                          F(r, n)
                      }
                      $(e)
                  }, function(e) {
                      x(r, e)
                  }).catch(d)
              }
              function ne(e) {
                  var t = Q(e);
                  return t <= 0
              }
              function ae(e, t) {
                  var r = e._controlledWritableStream;
                  f(r._state === "writable");
                  C(r, t)
              }
              function ie(e) {
                  return new TypeError("WritableStream.prototype." + e + " can only be used on a WritableStream")
              }
              function se(e) {
                  return new TypeError("WritableStreamDefaultWriter.prototype." + e + " can only be used on a WritableStreamDefaultWriter")
              }
              function oe(e) {
                  return new TypeError("Cannot " + e + " a stream using a released writer")
              }
              function le(e) {
                  e._closedPromise = new Promise(function(t, r) {
                      e._closedPromise_resolve = t;
                      e._closedPromise_reject = r;
                      e._closedPromiseState = "pending"
                  }
                  )
              }
              function ue(e, t) {
                  e._closedPromise = Promise.reject(t);
                  e._closedPromise_resolve = undefined;
                  e._closedPromise_reject = undefined;
                  e._closedPromiseState = "rejected"
              }
              function ce(e) {
                  e._closedPromise = Promise.resolve(undefined);
                  e._closedPromise_resolve = undefined;
                  e._closedPromise_reject = undefined;
                  e._closedPromiseState = "resolved"
              }
              function fe(e, t) {
                  f(e._closedPromise_resolve !== undefined, "writer._closedPromise_resolve !== undefined");
                  f(e._closedPromise_reject !== undefined, "writer._closedPromise_reject !== undefined");
                  f(e._closedPromiseState === "pending", "writer._closedPromiseState is pending");
                  e._closedPromise_reject(t);
                  e._closedPromise_resolve = undefined;
                  e._closedPromise_reject = undefined;
                  e._closedPromiseState = "rejected"
              }
              function de(e, t) {
                  f(e._closedPromise_resolve === undefined, "writer._closedPromise_resolve === undefined");
                  f(e._closedPromise_reject === undefined, "writer._closedPromise_reject === undefined");
                  f(e._closedPromiseState !== "pending", "writer._closedPromiseState is not pending");
                  e._closedPromise = Promise.reject(t);
                  e._closedPromiseState = "rejected"
              }
              function he(e) {
                  f(e._closedPromise_resolve !== undefined, "writer._closedPromise_resolve !== undefined");
                  f(e._closedPromise_reject !== undefined, "writer._closedPromise_reject !== undefined");
                  f(e._closedPromiseState === "pending", "writer._closedPromiseState is pending");
                  e._closedPromise_resolve(undefined);
                  e._closedPromise_resolve = undefined;
                  e._closedPromise_reject = undefined;
                  e._closedPromiseState = "resolved"
              }
              function pe(e) {
                  e._readyPromise = new Promise(function(t, r) {
                      e._readyPromise_resolve = t;
                      e._readyPromise_reject = r
                  }
                  );
                  e._readyPromiseState = "pending"
              }
              function ve(e, t) {
                  e._readyPromise = Promise.reject(t);
                  e._readyPromise_resolve = undefined;
                  e._readyPromise_reject = undefined;
                  e._readyPromiseState = "rejected"
              }
              function me(e) {
                  e._readyPromise = Promise.resolve(undefined);
                  e._readyPromise_resolve = undefined;
                  e._readyPromise_reject = undefined;
                  e._readyPromiseState = "fulfilled"
              }
              function ge(e, t) {
                  f(e._readyPromise_resolve !== undefined, "writer._readyPromise_resolve !== undefined");
                  f(e._readyPromise_reject !== undefined, "writer._readyPromise_reject !== undefined");
                  e._readyPromise_reject(t);
                  e._readyPromise_resolve = undefined;
                  e._readyPromise_reject = undefined;
                  e._readyPromiseState = "rejected"
              }
              function be(e) {
                  f(e._readyPromise_resolve === undefined, "writer._readyPromise_resolve === undefined");
                  f(e._readyPromise_reject === undefined, "writer._readyPromise_reject === undefined");
                  e._readyPromise = new Promise(function(t, r) {
                      e._readyPromise_resolve = t;
                      e._readyPromise_reject = r
                  }
                  );
                  e._readyPromiseState = "pending"
              }
              function _e(e, t) {
                  f(e._readyPromise_resolve === undefined, "writer._readyPromise_resolve === undefined");
                  f(e._readyPromise_reject === undefined, "writer._readyPromise_reject === undefined");
                  e._readyPromise = Promise.reject(t);
                  e._readyPromiseState = "rejected"
              }
              function ye(e) {
                  f(e._readyPromise_resolve !== undefined, "writer._readyPromise_resolve !== undefined");
                  f(e._readyPromise_reject !== undefined, "writer._readyPromise_reject !== undefined");
                  e._readyPromise_resolve(undefined);
                  e._readyPromise_resolve = undefined;
                  e._readyPromise_reject = undefined;
                  e._readyPromiseState = "fulfilled"
              }
          }
          , function(e, t, r) {
              "use strict";
              var n = r(0)
                , a = n.IsFiniteNonNegativeNumber;
              var i = r(1)
                , s = i.assert;
              t.DequeueValue = function(e) {
                  s("_queue"in e && "_queueTotalSize"in e, "Spec-level failure: DequeueValue should only be used on containers with [[queue]] and [[queueTotalSize]].");
                  s(e._queue.length > 0, "Spec-level failure: should never dequeue from an empty queue.");
                  var t = e._queue.shift();
                  e._queueTotalSize -= t.size;
                  if (e._queueTotalSize < 0) {
                      e._queueTotalSize = 0
                  }
                  return t.value
              }
              ;
              t.EnqueueValueWithSize = function(e, t, r) {
                  s("_queue"in e && "_queueTotalSize"in e, "Spec-level failure: EnqueueValueWithSize should only be used on containers with [[queue]] and " + "[[queueTotalSize]].");
                  r = Number(r);
                  if (!a(r)) {
                      throw new RangeError("Size must be a finite, non-NaN, non-negative number.")
                  }
                  e._queue.push({
                      value: t,
                      size: r
                  });
                  e._queueTotalSize += r
              }
              ;
              t.PeekQueueValue = function(e) {
                  s("_queue"in e && "_queueTotalSize"in e, "Spec-level failure: PeekQueueValue should only be used on containers with [[queue]] and [[queueTotalSize]].");
                  s(e._queue.length > 0, "Spec-level failure: should never peek at an empty queue.");
                  var t = e._queue[0];
                  return t.value
              }
              ;
              t.ResetQueue = function(e) {
                  s("_queue"in e && "_queueTotalSize"in e, "Spec-level failure: ResetQueue should only be used on containers with [[queue]] and [[queueTotalSize]].");
                  e._queue = [];
                  e._queueTotalSize = 0
              }
          }
          , function(e, t, r) {
              "use strict";
              var n = function() {
                  function e(e, t) {
                      for (var r = 0; r < t.length; r++) {
                          var n = t[r];
                          n.enumerable = n.enumerable || false;
                          n.configurable = true;
                          if ("value"in n)
                              n.writable = true;
                          Object.defineProperty(e, n.key, n)
                      }
                  }
                  return function(t, r, n) {
                      if (r)
                          e(t.prototype, r);
                      if (n)
                          e(t, n);
                      return t
                  }
              }();
              function a(e, t) {
                  if (!(e instanceof t)) {
                      throw new TypeError("Cannot call a class as a function")
                  }
              }
              var i = r(0)
                , s = i.ArrayBufferCopy
                , o = i.CreateIterResultObject
                , l = i.IsFiniteNonNegativeNumber
                , u = i.InvokeOrNoop
                , c = i.PromiseInvokeOrNoop
                , f = i.TransferArrayBuffer
                , d = i.ValidateAndNormalizeQueuingStrategy
                , h = i.ValidateAndNormalizeHighWaterMark;
              var p = r(0)
                , v = p.createArrayFromList
                , m = p.createDataProperty
                , g = p.typeIsObject;
              var b = r(1)
                , _ = b.assert
                , y = b.rethrowAssertionErrorRejection;
              var A = r(3)
                , S = A.DequeueValue
                , w = A.EnqueueValueWithSize
                , P = A.ResetQueue;
              var C = r(2)
                , k = C.AcquireWritableStreamDefaultWriter
                , R = C.IsWritableStream
                , x = C.IsWritableStreamLocked
                , T = C.WritableStreamAbort
                , E = C.WritableStreamDefaultWriterCloseWithErrorPropagation
                , I = C.WritableStreamDefaultWriterRelease
                , L = C.WritableStreamDefaultWriterWrite
                , O = C.WritableStreamCloseQueuedOrInFlight;
              var j = function() {
                  function e() {
                      var t = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
                      var r = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {}
                        , n = r.size
                        , i = r.highWaterMark;
                      a(this, e);
                      this._state = "readable";
                      this._reader = undefined;
                      this._storedError = undefined;
                      this._disturbed = false;
                      this._readableStreamController = undefined;
                      var s = t.type;
                      var o = String(s);
                      if (o === "bytes") {
                          if (i === undefined) {
                              i = 0
                          }
                          this._readableStreamController = new ye(this,t,i)
                      } else if (s === undefined) {
                          if (i === undefined) {
                              i = 1
                          }
                          this._readableStreamController = new ce(this,t,n,i)
                      } else {
                          throw new RangeError("Invalid type is specified")
                      }
                  }
                  n(e, [{
                      key: "cancel",
                      value: function e(t) {
                          if (N(this) === false) {
                              return Promise.reject(He("cancel"))
                          }
                          if (q(this) === true) {
                              return Promise.reject(new TypeError("Cannot cancel a stream that already has a reader"))
                          }
                          return X(this, t)
                      }
                  }, {
                      key: "getReader",
                      value: function e() {
                          var t = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {}
                            , r = t.mode;
                          if (N(this) === false) {
                              throw He("getReader")
                          }
                          if (r === undefined) {
                              return F(this)
                          }
                          r = String(r);
                          if (r === "byob") {
                              return D(this)
                          }
                          throw new RangeError("Invalid mode is specified")
                      }
                  }, {
                      key: "pipeThrough",
                      value: function e(t, r) {
                          var n = t.writable
                            , a = t.readable;
                          var i = this.pipeTo(n, r);
                          at(i);
                          return a
                      }
                  }, {
                      key: "pipeTo",
                      value: function e(t) {
                          var r = this;
                          var n = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {}
                            , a = n.preventClose
                            , i = n.preventAbort
                            , s = n.preventCancel;
                          if (N(this) === false) {
                              return Promise.reject(He("pipeTo"))
                          }
                          if (R(t) === false) {
                              return Promise.reject(new TypeError("ReadableStream.prototype.pipeTo's first argument must be a WritableStream"))
                          }
                          a = Boolean(a);
                          i = Boolean(i);
                          s = Boolean(s);
                          if (q(this) === true) {
                              return Promise.reject(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked ReadableStream"))
                          }
                          if (x(t) === true) {
                              return Promise.reject(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked WritableStream"))
                          }
                          var o = F(this);
                          var l = k(t);
                          var u = false;
                          var c = Promise.resolve();
                          return new Promise(function(e, n) {
                              function f() {
                                  c = Promise.resolve();
                                  if (u === true) {
                                      return Promise.resolve()
                                  }
                                  return l._readyPromise.then(function() {
                                      return ue(o).then(function(e) {
                                          var t = e.value
                                            , r = e.done;
                                          if (r === true) {
                                              return
                                          }
                                          c = L(l, t).catch(function() {})
                                      })
                                  }).then(f)
                              }
                              p(r, o._closedPromise, function(e) {
                                  if (i === false) {
                                      m(function() {
                                          return T(t, e)
                                      }, true, e)
                                  } else {
                                      g(true, e)
                                  }
                              });
                              p(t, l._closedPromise, function(e) {
                                  if (s === false) {
                                      m(function() {
                                          return X(r, e)
                                      }, true, e)
                                  } else {
                                      g(true, e)
                                  }
                              });
                              v(r, o._closedPromise, function() {
                                  if (a === false) {
                                      m(function() {
                                          return E(l)
                                      })
                                  } else {
                                      g()
                                  }
                              });
                              if (O(t) === true || t._state === "closed") {
                                  var d = new TypeError("the destination writable stream closed before all data could be piped to it");
                                  if (s === false) {
                                      m(function() {
                                          return X(r, d)
                                      }, true, d)
                                  } else {
                                      g(true, d)
                                  }
                              }
                              f().catch(function(e) {
                                  c = Promise.resolve();
                                  y(e)
                              });
                              function h() {
                                  var e = c;
                                  return c.then(function() {
                                      return e !== c ? h() : undefined
                                  })
                              }
                              function p(e, t, r) {
                                  if (e._state === "errored") {
                                      r(e._storedError)
                                  } else {
                                      t.catch(r).catch(y)
                                  }
                              }
                              function v(e, t, r) {
                                  if (e._state === "closed") {
                                      r()
                                  } else {
                                      t.then(r).catch(y)
                                  }
                              }
                              function m(e, r, n) {
                                  if (u === true) {
                                      return
                                  }
                                  u = true;
                                  if (t._state === "writable" && O(t) === false) {
                                      h().then(a)
                                  } else {
                                      a()
                                  }
                                  function a() {
                                      e().then(function() {
                                          return b(r, n)
                                      }, function(e) {
                                          return b(true, e)
                                      }).catch(y)
                                  }
                              }
                              function g(e, r) {
                                  if (u === true) {
                                      return
                                  }
                                  u = true;
                                  if (t._state === "writable" && O(t) === false) {
                                      h().then(function() {
                                          return b(e, r)
                                      }).catch(y)
                                  } else {
                                      b(e, r)
                                  }
                              }
                              function b(t, r) {
                                  I(l);
                                  oe(o);
                                  if (t) {
                                      n(r)
                                  } else {
                                      e(undefined)
                                  }
                              }
                          }
                          )
                      }
                  }, {
                      key: "tee",
                      value: function e() {
                          if (N(this) === false) {
                              throw He("tee")
                          }
                          var t = U(this, false);
                          return v(t)
                      }
                  }, {
                      key: "locked",
                      get: function e() {
                          if (N(this) === false) {
                              throw He("locked")
                          }
                          return q(this)
                      }
                  }]);
                  return e
              }();
              e.exports = {
                  ReadableStream: j,
                  IsReadableStreamDisturbed: M,
                  ReadableStreamDefaultControllerClose: pe,
                  ReadableStreamDefaultControllerEnqueue: ve,
                  ReadableStreamDefaultControllerError: me,
                  ReadableStreamDefaultControllerGetDesiredSize: be
              };
              function D(e) {
                  return new re(e)
              }
              function F(e) {
                  return new te(e)
              }
              function N(e) {
                  if (!g(e)) {
                      return false
                  }
                  if (!Object.prototype.hasOwnProperty.call(e, "_readableStreamController")) {
                      return false
                  }
                  return true
              }
              function M(e) {
                  _(N(e) === true, "IsReadableStreamDisturbed should only be used on known readable streams");
                  return e._disturbed
              }
              function q(e) {
                  _(N(e) === true, "IsReadableStreamLocked should only be used on known readable streams");
                  if (e._reader === undefined) {
                      return false
                  }
                  return true
              }
              function U(e, t) {
                  _(N(e) === true);
                  _(typeof t === "boolean");
                  var r = F(e);
                  var n = {
                      closedOrErrored: false,
                      canceled1: false,
                      canceled2: false,
                      reason1: undefined,
                      reason2: undefined
                  };
                  n.promise = new Promise(function(e) {
                      n._resolve = e
                  }
                  );
                  var a = W();
                  a._reader = r;
                  a._teeState = n;
                  a._cloneForBranch2 = t;
                  var i = B();
                  i._stream = e;
                  i._teeState = n;
                  var s = z();
                  s._stream = e;
                  s._teeState = n;
                  var o = Object.create(Object.prototype);
                  m(o, "pull", a);
                  m(o, "cancel", i);
                  var l = new j(o);
                  var u = Object.create(Object.prototype);
                  m(u, "pull", a);
                  m(u, "cancel", s);
                  var c = new j(u);
                  a._branch1 = l._readableStreamController;
                  a._branch2 = c._readableStreamController;
                  r._closedPromise.catch(function(e) {
                      if (n.closedOrErrored === true) {
                          return
                      }
                      me(a._branch1, e);
                      me(a._branch2, e);
                      n.closedOrErrored = true
                  });
                  return [l, c]
              }
              function W() {
                  function e() {
                      var t = e._reader
                        , r = e._branch1
                        , n = e._branch2
                        , a = e._teeState;
                      return ue(t).then(function(e) {
                          _(g(e));
                          var t = e.value;
                          var i = e.done;
                          _(typeof i === "boolean");
                          if (i === true && a.closedOrErrored === false) {
                              if (a.canceled1 === false) {
                                  pe(r)
                              }
                              if (a.canceled2 === false) {
                                  pe(n)
                              }
                              a.closedOrErrored = true
                          }
                          if (a.closedOrErrored === true) {
                              return
                          }
                          var s = t;
                          var o = t;
                          if (a.canceled1 === false) {
                              ve(r, s)
                          }
                          if (a.canceled2 === false) {
                              ve(n, o)
                          }
                      })
                  }
                  return e
              }
              function B() {
                  function e(t) {
                      var r = e._stream
                        , n = e._teeState;
                      n.canceled1 = true;
                      n.reason1 = t;
                      if (n.canceled2 === true) {
                          var a = v([n.reason1, n.reason2]);
                          var i = X(r, a);
                          n._resolve(i)
                      }
                      return n.promise
                  }
                  return e
              }
              function z() {
                  function e(t) {
                      var r = e._stream
                        , n = e._teeState;
                      n.canceled2 = true;
                      n.reason2 = t;
                      if (n.canceled1 === true) {
                          var a = v([n.reason1, n.reason2]);
                          var i = X(r, a);
                          n._resolve(i)
                      }
                      return n.promise
                  }
                  return e
              }
              function G(e) {
                  _(ne(e._reader) === true);
                  _(e._state === "readable" || e._state === "closed");
                  var t = new Promise(function(t, r) {
                      var n = {
                          _resolve: t,
                          _reject: r
                      };
                      e._reader._readIntoRequests.push(n)
                  }
                  );
                  return t
              }
              function H(e) {
                  _(ae(e._reader) === true);
                  _(e._state === "readable");
                  var t = new Promise(function(t, r) {
                      var n = {
                          _resolve: t,
                          _reject: r
                      };
                      e._reader._readRequests.push(n)
                  }
                  );
                  return t
              }
              function X(e, t) {
                  e._disturbed = true;
                  if (e._state === "closed") {
                      return Promise.resolve(undefined)
                  }
                  if (e._state === "errored") {
                      return Promise.reject(e._storedError)
                  }
                  Y(e);
                  var r = e._readableStreamController.__cancelSteps(t);
                  return r.then(function() {
                      return undefined
                  })
              }
              function Y(e) {
                  _(e._state === "readable");
                  e._state = "closed";
                  var t = e._reader;
                  if (t === undefined) {
                      return undefined
                  }
                  if (ae(t) === true) {
                      for (var r = 0; r < t._readRequests.length; r++) {
                          var n = t._readRequests[r]._resolve;
                          n(o(undefined, true))
                      }
                      t._readRequests = []
                  }
                  $e(t);
                  return undefined
              }
              function V(e, t) {
                  _(N(e) === true, "stream must be ReadableStream");
                  _(e._state === "readable", "state must be readable");
                  e._state = "errored";
                  e._storedError = t;
                  var r = e._reader;
                  if (r === undefined) {
                      return undefined
                  }
                  if (ae(r) === true) {
                      for (var n = 0; n < r._readRequests.length; n++) {
                          var a = r._readRequests[n];
                          a._reject(t)
                      }
                      r._readRequests = []
                  } else {
                      _(ne(r), "reader must be ReadableStreamBYOBReader");
                      for (var i = 0; i < r._readIntoRequests.length; i++) {
                          var s = r._readIntoRequests[i];
                          s._reject(t)
                      }
                      r._readIntoRequests = []
                  }
                  Ke(r, t);
                  r._closedPromise.catch(function() {})
              }
              function J(e, t, r) {
                  var n = e._reader;
                  _(n._readIntoRequests.length > 0);
                  var a = n._readIntoRequests.shift();
                  a._resolve(o(t, r))
              }
              function Q(e, t, r) {
                  var n = e._reader;
                  _(n._readRequests.length > 0);
                  var a = n._readRequests.shift();
                  a._resolve(o(t, r))
              }
              function K(e) {
                  return e._reader._readIntoRequests.length
              }
              function Z(e) {
                  return e._reader._readRequests.length
              }
              function $(e) {
                  var t = e._reader;
                  if (t === undefined) {
                      return false
                  }
                  if (ne(t) === false) {
                      return false
                  }
                  return true
              }
              function ee(e) {
                  var t = e._reader;
                  if (t === undefined) {
                      return false
                  }
                  if (ae(t) === false) {
                      return false
                  }
                  return true
              }
              var te = function() {
                  function e(t) {
                      a(this, e);
                      if (N(t) === false) {
                          throw new TypeError("ReadableStreamDefaultReader can only be constructed with a ReadableStream instance")
                      }
                      if (q(t) === true) {
                          throw new TypeError("This stream has already been locked for exclusive reading by another reader")
                      }
                      ie(this, t);
                      this._readRequests = []
                  }
                  n(e, [{
                      key: "cancel",
                      value: function e(t) {
                          if (ae(this) === false) {
                              return Promise.reject(Ye("cancel"))
                          }
                          if (this._ownerReadableStream === undefined) {
                              return Promise.reject(Xe("cancel"))
                          }
                          return se(this, t)
                      }
                  }, {
                      key: "read",
                      value: function e() {
                          if (ae(this) === false) {
                              return Promise.reject(Ye("read"))
                          }
                          if (this._ownerReadableStream === undefined) {
                              return Promise.reject(Xe("read from"))
                          }
                          return ue(this)
                      }
                  }, {
                      key: "releaseLock",
                      value: function e() {
                          if (ae(this) === false) {
                              throw Ye("releaseLock")
                          }
                          if (this._ownerReadableStream === undefined) {
                              return
                          }
                          if (this._readRequests.length > 0) {
                              throw new TypeError("Tried to release a reader lock when that reader has pending read() calls un-settled")
                          }
                          oe(this)
                      }
                  }, {
                      key: "closed",
                      get: function e() {
                          if (ae(this) === false) {
                              return Promise.reject(Ye("closed"))
                          }
                          return this._closedPromise
                      }
                  }]);
                  return e
              }();
              var re = function() {
                  function e(t) {
                      a(this, e);
                      if (!N(t)) {
                          throw new TypeError("ReadableStreamBYOBReader can only be constructed with a ReadableStream instance given a " + "byte source")
                      }
                      if (Ae(t._readableStreamController) === false) {
                          throw new TypeError("Cannot construct a ReadableStreamBYOBReader for a stream not constructed with a byte " + "source")
                      }
                      if (q(t)) {
                          throw new TypeError("This stream has already been locked for exclusive reading by another reader")
                      }
                      ie(this, t);
                      this._readIntoRequests = []
                  }
                  n(e, [{
                      key: "cancel",
                      value: function e(t) {
                          if (!ne(this)) {
                              return Promise.reject(et("cancel"))
                          }
                          if (this._ownerReadableStream === undefined) {
                              return Promise.reject(Xe("cancel"))
                          }
                          return se(this, t)
                      }
                  }, {
                      key: "read",
                      value: function e(t) {
                          if (!ne(this)) {
                              return Promise.reject(et("read"))
                          }
                          if (this._ownerReadableStream === undefined) {
                              return Promise.reject(Xe("read from"))
                          }
                          if (!ArrayBuffer.isView(t)) {
                              return Promise.reject(new TypeError("view must be an array buffer view"))
                          }
                          if (t.byteLength === 0) {
                              return Promise.reject(new TypeError("view must have non-zero byteLength"))
                          }
                          return le(this, t)
                      }
                  }, {
                      key: "releaseLock",
                      value: function e() {
                          if (!ne(this)) {
                              throw et("releaseLock")
                          }
                          if (this._ownerReadableStream === undefined) {
                              return
                          }
                          if (this._readIntoRequests.length > 0) {
                              throw new TypeError("Tried to release a reader lock when that reader has pending read() calls un-settled")
                          }
                          oe(this)
                      }
                  }, {
                      key: "closed",
                      get: function e() {
                          if (!ne(this)) {
                              return Promise.reject(et("closed"))
                          }
                          return this._closedPromise
                      }
                  }]);
                  return e
              }();
              function ne(e) {
                  if (!g(e)) {
                      return false
                  }
                  if (!Object.prototype.hasOwnProperty.call(e, "_readIntoRequests")) {
                      return false
                  }
                  return true
              }
              function ae(e) {
                  if (!g(e)) {
                      return false
                  }
                  if (!Object.prototype.hasOwnProperty.call(e, "_readRequests")) {
                      return false
                  }
                  return true
              }
              function ie(e, t) {
                  e._ownerReadableStream = t;
                  t._reader = e;
                  if (t._state === "readable") {
                      Ve(e)
                  } else if (t._state === "closed") {
                      Qe(e)
                  } else {
                      _(t._state === "errored", "state must be errored");
                      Je(e, t._storedError);
                      e._closedPromise.catch(function() {})
                  }
              }
              function se(e, t) {
                  var r = e._ownerReadableStream;
                  _(r !== undefined);
                  return X(r, t)
              }
              function oe(e) {
                  _(e._ownerReadableStream !== undefined);
                  _(e._ownerReadableStream._reader === e);
                  if (e._ownerReadableStream._state === "readable") {
                      Ke(e, new TypeError("Reader was released and can no longer be used to monitor the stream's closedness"))
                  } else {
                      Ze(e, new TypeError("Reader was released and can no longer be used to monitor the stream's closedness"))
                  }
                  e._closedPromise.catch(function() {});
                  e._ownerReadableStream._reader = undefined;
                  e._ownerReadableStream = undefined
              }
              function le(e, t) {
                  var r = e._ownerReadableStream;
                  _(r !== undefined);
                  r._disturbed = true;
                  if (r._state === "errored") {
                      return Promise.reject(r._storedError)
                  }
                  return Oe(r._readableStreamController, t)
              }
              function ue(e) {
                  var t = e._ownerReadableStream;
                  _(t !== undefined);
                  t._disturbed = true;
                  if (t._state === "closed") {
                      return Promise.resolve(o(undefined, true))
                  }
                  if (t._state === "errored") {
                      return Promise.reject(t._storedError)
                  }
                  _(t._state === "readable");
                  return t._readableStreamController.__pullSteps()
              }
              var ce = function() {
                  function e(t, r, n, i) {
                      a(this, e);
                      if (N(t) === false) {
                          throw new TypeError("ReadableStreamDefaultController can only be constructed with a ReadableStream instance")
                      }
                      if (t._readableStreamController !== undefined) {
                          throw new TypeError("ReadableStreamDefaultController instances can only be created by the ReadableStream constructor")
                      }
                      this._controlledReadableStream = t;
                      this._underlyingSource = r;
                      this._queue = undefined;
                      this._queueTotalSize = undefined;
                      P(this);
                      this._started = false;
                      this._closeRequested = false;
                      this._pullAgain = false;
                      this._pulling = false;
                      var s = d(n, i);
                      this._strategySize = s.size;
                      this._strategyHWM = s.highWaterMark;
                      var o = this;
                      var l = u(r, "start", [this]);
                      Promise.resolve(l).then(function() {
                          o._started = true;
                          _(o._pulling === false);
                          _(o._pullAgain === false);
                          de(o)
                      }, function(e) {
                          ge(o, e)
                      }).catch(y)
                  }
                  n(e, [{
                      key: "close",
                      value: function e() {
                          if (fe(this) === false) {
                              throw tt("close")
                          }
                          if (this._closeRequested === true) {
                              throw new TypeError("The stream has already been closed; do not close it again!")
                          }
                          var t = this._controlledReadableStream._state;
                          if (t !== "readable") {
                              throw new TypeError("The stream (in " + t + " state) is not in the readable state and cannot be closed")
                          }
                          pe(this)
                      }
                  }, {
                      key: "enqueue",
                      value: function e(t) {
                          if (fe(this) === false) {
                              throw tt("enqueue")
                          }
                          if (this._closeRequested === true) {
                              throw new TypeError("stream is closed or draining")
                          }
                          var r = this._controlledReadableStream._state;
                          if (r !== "readable") {
                              throw new TypeError("The stream (in " + r + " state) is not in the readable state and cannot be enqueued to")
                          }
                          return ve(this, t)
                      }
                  }, {
                      key: "error",
                      value: function e(t) {
                          if (fe(this) === false) {
                              throw tt("error")
                          }
                          var r = this._controlledReadableStream;
                          if (r._state !== "readable") {
                              throw new TypeError("The stream is " + r._state + " and so cannot be errored")
                          }
                          me(this, t)
                      }
                  }, {
                      key: "__cancelSteps",
                      value: function e(t) {
                          P(this);
                          return c(this._underlyingSource, "cancel", [t])
                      }
                  }, {
                      key: "__pullSteps",
                      value: function e() {
                          var t = this._controlledReadableStream;
                          if (this._queue.length > 0) {
                              var r = S(this);
                              if (this._closeRequested === true && this._queue.length === 0) {
                                  Y(t)
                              } else {
                                  de(this)
                              }
                              return Promise.resolve(o(r, false))
                          }
                          var n = H(t);
                          de(this);
                          return n
                      }
                  }, {
                      key: "desiredSize",
                      get: function e() {
                          if (fe(this) === false) {
                              throw tt("desiredSize")
                          }
                          return be(this)
                      }
                  }]);
                  return e
              }();
              function fe(e) {
                  if (!g(e)) {
                      return false
                  }
                  if (!Object.prototype.hasOwnProperty.call(e, "_underlyingSource")) {
                      return false
                  }
                  return true
              }
              function de(e) {
                  var t = he(e);
                  if (t === false) {
                      return undefined
                  }
                  if (e._pulling === true) {
                      e._pullAgain = true;
                      return undefined
                  }
                  _(e._pullAgain === false);
                  e._pulling = true;
                  var r = c(e._underlyingSource, "pull", [e]);
                  r.then(function() {
                      e._pulling = false;
                      if (e._pullAgain === true) {
                          e._pullAgain = false;
                          return de(e)
                      }
                      return undefined
                  }, function(t) {
                      ge(e, t)
                  }).catch(y);
                  return undefined
              }
              function he(e) {
                  var t = e._controlledReadableStream;
                  if (t._state === "closed" || t._state === "errored") {
                      return false
                  }
                  if (e._closeRequested === true) {
                      return false
                  }
                  if (e._started === false) {
                      return false
                  }
                  if (q(t) === true && Z(t) > 0) {
                      return true
                  }
                  var r = be(e);
                  if (r > 0) {
                      return true
                  }
                  return false
              }
              function pe(e) {
                  var t = e._controlledReadableStream;
                  _(e._closeRequested === false);
                  _(t._state === "readable");
                  e._closeRequested = true;
                  if (e._queue.length === 0) {
                      Y(t)
                  }
              }
              function ve(e, t) {
                  var r = e._controlledReadableStream;
                  _(e._closeRequested === false);
                  _(r._state === "readable");
                  if (q(r) === true && Z(r) > 0) {
                      Q(r, t, false)
                  } else {
                      var n = 1;
                      if (e._strategySize !== undefined) {
                          var a = e._strategySize;
                          try {
                              n = a(t)
                          } catch (t) {
                              ge(e, t);
                              throw t
                          }
                      }
                      try {
                          w(e, t, n)
                      } catch (t) {
                          ge(e, t);
                          throw t
                      }
                  }
                  de(e);
                  return undefined
              }
              function me(e, t) {
                  var r = e._controlledReadableStream;
                  _(r._state === "readable");
                  P(e);
                  V(r, t)
              }
              function ge(e, t) {
                  if (e._controlledReadableStream._state === "readable") {
                      me(e, t)
                  }
              }
              function be(e) {
                  var t = e._controlledReadableStream;
                  var r = t._state;
                  if (r === "errored") {
                      return null
                  }
                  if (r === "closed") {
                      return 0
                  }
                  return e._strategyHWM - e._queueTotalSize
              }
              var _e = function() {
                  function e(t, r) {
                      a(this, e);
                      this._associatedReadableByteStreamController = t;
                      this._view = r
                  }
                  n(e, [{
                      key: "respond",
                      value: function e(t) {
                          if (Se(this) === false) {
                              throw rt("respond")
                          }
                          if (this._associatedReadableByteStreamController === undefined) {
                              throw new TypeError("This BYOB request has been invalidated")
                          }
                          ze(this._associatedReadableByteStreamController, t)
                      }
                  }, {
                      key: "respondWithNewView",
                      value: function e(t) {
                          if (Se(this) === false) {
                              throw rt("respond")
                          }
                          if (this._associatedReadableByteStreamController === undefined) {
                              throw new TypeError("This BYOB request has been invalidated")
                          }
                          if (!ArrayBuffer.isView(t)) {
                              throw new TypeError("You can only respond with array buffer views")
                          }
                          Ge(this._associatedReadableByteStreamController, t)
                      }
                  }, {
                      key: "view",
                      get: function e() {
                          return this._view
                      }
                  }]);
                  return e
              }();
              var ye = function() {
                  function e(t, r, n) {
                      a(this, e);
                      if (N(t) === false) {
                          throw new TypeError("ReadableByteStreamController can only be constructed with a ReadableStream instance given " + "a byte source")
                      }
                      if (t._readableStreamController !== undefined) {
                          throw new TypeError("ReadableByteStreamController instances can only be created by the ReadableStream constructor given a byte " + "source")
                      }
                      this._controlledReadableStream = t;
                      this._underlyingByteSource = r;
                      this._pullAgain = false;
                      this._pulling = false;
                      Pe(this);
                      this._queue = this._queueTotalSize = undefined;
                      P(this);
                      this._closeRequested = false;
                      this._started = false;
                      this._strategyHWM = h(n);
                      var i = r.autoAllocateChunkSize;
                      if (i !== undefined) {
                          if (Number.isInteger(i) === false || i <= 0) {
                              throw new RangeError("autoAllocateChunkSize must be a positive integer")
                          }
                      }
                      this._autoAllocateChunkSize = i;
                      this._pendingPullIntos = [];
                      var s = this;
                      var o = u(r, "start", [this]);
                      Promise.resolve(o).then(function() {
                          s._started = true;
                          _(s._pulling === false);
                          _(s._pullAgain === false);
                          we(s)
                      }, function(e) {
                          if (t._state === "readable") {
                              We(s, e)
                          }
                      }).catch(y)
                  }
                  n(e, [{
                      key: "close",
                      value: function e() {
                          if (Ae(this) === false) {
                              throw nt("close")
                          }
                          if (this._closeRequested === true) {
                              throw new TypeError("The stream has already been closed; do not close it again!")
                          }
                          var t = this._controlledReadableStream._state;
                          if (t !== "readable") {
                              throw new TypeError("The stream (in " + t + " state) is not in the readable state and cannot be closed")
                          }
                          qe(this)
                      }
                  }, {
                      key: "enqueue",
                      value: function e(t) {
                          if (Ae(this) === false) {
                              throw nt("enqueue")
                          }
                          if (this._closeRequested === true) {
                              throw new TypeError("stream is closed or draining")
                          }
                          var r = this._controlledReadableStream._state;
                          if (r !== "readable") {
                              throw new TypeError("The stream (in " + r + " state) is not in the readable state and cannot be enqueued to")
                          }
                          if (!ArrayBuffer.isView(t)) {
                              throw new TypeError("You can only enqueue array buffer views when using a ReadableByteStreamController")
                          }
                          Ue(this, t)
                      }
                  }, {
                      key: "error",
                      value: function e(t) {
                          if (Ae(this) === false) {
                              throw nt("error")
                          }
                          var r = this._controlledReadableStream;
                          if (r._state !== "readable") {
                              throw new TypeError("The stream is " + r._state + " and so cannot be errored")
                          }
                          We(this, t)
                      }
                  }, {
                      key: "__cancelSteps",
                      value: function e(t) {
                          if (this._pendingPullIntos.length > 0) {
                              var r = this._pendingPullIntos[0];
                              r.bytesFilled = 0
                          }
                          P(this);
                          return c(this._underlyingByteSource, "cancel", [t])
                      }
                  }, {
                      key: "__pullSteps",
                      value: function e() {
                          var t = this._controlledReadableStream;
                          _(ee(t) === true);
                          if (this._queueTotalSize > 0) {
                              _(Z(t) === 0);
                              var r = this._queue.shift();
                              this._queueTotalSize -= r.byteLength;
                              Ee(this);
                              var n = void 0;
                              try {
                                  n = new Uint8Array(r.buffer,r.byteOffset,r.byteLength)
                              } catch (e) {
                                  return Promise.reject(e)
                              }
                              return Promise.resolve(o(n, false))
                          }
                          var a = this._autoAllocateChunkSize;
                          if (a !== undefined) {
                              var i = void 0;
                              try {
                                  i = new ArrayBuffer(a)
                              } catch (e) {
                                  return Promise.reject(e)
                              }
                              var s = {
                                  buffer: i,
                                  byteOffset: 0,
                                  byteLength: a,
                                  bytesFilled: 0,
                                  elementSize: 1,
                                  ctor: Uint8Array,
                                  readerType: "default"
                              };
                              this._pendingPullIntos.push(s)
                          }
                          var l = H(t);
                          we(this);
                          return l
                      }
                  }, {
                      key: "byobRequest",
                      get: function e() {
                          if (Ae(this) === false) {
                              throw nt("byobRequest")
                          }
                          if (this._byobRequest === undefined && this._pendingPullIntos.length > 0) {
                              var t = this._pendingPullIntos[0];
                              var r = new Uint8Array(t.buffer,t.byteOffset + t.bytesFilled,t.byteLength - t.bytesFilled);
                              this._byobRequest = new _e(this,r)
                          }
                          return this._byobRequest
                      }
                  }, {
                      key: "desiredSize",
                      get: function e() {
                          if (Ae(this) === false) {
                              throw nt("desiredSize")
                          }
                          return Be(this)
                      }
                  }]);
                  return e
              }();
              function Ae(e) {
                  if (!g(e)) {
                      return false
                  }
                  if (!Object.prototype.hasOwnProperty.call(e, "_underlyingByteSource")) {
                      return false
                  }
                  return true
              }
              function Se(e) {
                  if (!g(e)) {
                      return false
                  }
                  if (!Object.prototype.hasOwnProperty.call(e, "_associatedReadableByteStreamController")) {
                      return false
                  }
                  return true
              }
              function we(e) {
                  var t = Me(e);
                  if (t === false) {
                      return undefined
                  }
                  if (e._pulling === true) {
                      e._pullAgain = true;
                      return undefined
                  }
                  _(e._pullAgain === false);
                  e._pulling = true;
                  var r = c(e._underlyingByteSource, "pull", [e]);
                  r.then(function() {
                      e._pulling = false;
                      if (e._pullAgain === true) {
                          e._pullAgain = false;
                          we(e)
                      }
                  }, function(t) {
                      if (e._controlledReadableStream._state === "readable") {
                          We(e, t)
                      }
                  }).catch(y);
                  return undefined
              }
              function Pe(e) {
                  Ie(e);
                  e._pendingPullIntos = []
              }
              function Ce(e, t) {
                  _(e._state !== "errored", "state must not be errored");
                  var r = false;
                  if (e._state === "closed") {
                      _(t.bytesFilled === 0);
                      r = true
                  }
                  var n = ke(t);
                  if (t.readerType === "default") {
                      Q(e, n, r)
                  } else {
                      _(t.readerType === "byob");
                      J(e, n, r)
                  }
              }
              function ke(e) {
                  var t = e.bytesFilled;
                  var r = e.elementSize;
                  _(t <= e.byteLength);
                  _(t % r === 0);
                  return new e.ctor(e.buffer,e.byteOffset,t / r)
              }
              function Re(e, t, r, n) {
                  e._queue.push({
                      buffer: t,
                      byteOffset: r,
                      byteLength: n
                  });
                  e._queueTotalSize += n
              }
              function xe(e, t) {
                  var r = t.elementSize;
                  var n = t.bytesFilled - t.bytesFilled % r;
                  var a = Math.min(e._queueTotalSize, t.byteLength - t.bytesFilled);
                  var i = t.bytesFilled + a;
                  var o = i - i % r;
                  var l = a;
                  var u = false;
                  if (o > n) {
                      l = o - t.bytesFilled;
                      u = true
                  }
                  var c = e._queue;
                  while (l > 0) {
                      var f = c[0];
                      var d = Math.min(l, f.byteLength);
                      var h = t.byteOffset + t.bytesFilled;
                      s(t.buffer, h, f.buffer, f.byteOffset, d);
                      if (f.byteLength === d) {
                          c.shift()
                      } else {
                          f.byteOffset += d;
                          f.byteLength -= d
                      }
                      e._queueTotalSize -= d;
                      Te(e, d, t);
                      l -= d
                  }
                  if (u === false) {
                      _(e._queueTotalSize === 0, "queue must be empty");
                      _(t.bytesFilled > 0);
                      _(t.bytesFilled < t.elementSize)
                  }
                  return u
              }
              function Te(e, t, r) {
                  _(e._pendingPullIntos.length === 0 || e._pendingPullIntos[0] === r);
                  Ie(e);
                  r.bytesFilled += t
              }
              function Ee(e) {
                  _(e._controlledReadableStream._state === "readable");
                  if (e._queueTotalSize === 0 && e._closeRequested === true) {
                      Y(e._controlledReadableStream)
                  } else {
                      we(e)
                  }
              }
              function Ie(e) {
                  if (e._byobRequest === undefined) {
                      return
                  }
                  e._byobRequest._associatedReadableByteStreamController = undefined;
                  e._byobRequest._view = undefined;
                  e._byobRequest = undefined
              }
              function Le(e) {
                  _(e._closeRequested === false);
                  while (e._pendingPullIntos.length > 0) {
                      if (e._queueTotalSize === 0) {
                          return
                      }
                      var t = e._pendingPullIntos[0];
                      if (xe(e, t) === true) {
                          Ne(e);
                          Ce(e._controlledReadableStream, t)
                      }
                  }
              }
              function Oe(e, t) {
                  var r = e._controlledReadableStream;
                  var n = 1;
                  if (t.constructor !== DataView) {
                      n = t.constructor.BYTES_PER_ELEMENT
                  }
                  var a = t.constructor;
                  var i = {
                      buffer: t.buffer,
                      byteOffset: t.byteOffset,
                      byteLength: t.byteLength,
                      bytesFilled: 0,
                      elementSize: n,
                      ctor: a,
                      readerType: "byob"
                  };
                  if (e._pendingPullIntos.length > 0) {
                      i.buffer = f(i.buffer);
                      e._pendingPullIntos.push(i);
                      return G(r)
                  }
                  if (r._state === "closed") {
                      var s = new t.constructor(i.buffer,i.byteOffset,0);
                      return Promise.resolve(o(s, true))
                  }
                  if (e._queueTotalSize > 0) {
                      if (xe(e, i) === true) {
                          var l = ke(i);
                          Ee(e);
                          return Promise.resolve(o(l, false))
                      }
                      if (e._closeRequested === true) {
                          var u = new TypeError("Insufficient bytes to fill elements in the given buffer");
                          We(e, u);
                          return Promise.reject(u)
                      }
                  }
                  i.buffer = f(i.buffer);
                  e._pendingPullIntos.push(i);
                  var c = G(r);
                  we(e);
                  return c
              }
              function je(e, t) {
                  t.buffer = f(t.buffer);
                  _(t.bytesFilled === 0, "bytesFilled must be 0");
                  var r = e._controlledReadableStream;
                  if ($(r) === true) {
                      while (K(r) > 0) {
                          var n = Ne(e);
                          Ce(r, n)
                      }
                  }
              }
              function De(e, t, r) {
                  if (r.bytesFilled + t > r.byteLength) {
                      throw new RangeError("bytesWritten out of range")
                  }
                  Te(e, t, r);
                  if (r.bytesFilled < r.elementSize) {
                      return
                  }
                  Ne(e);
                  var n = r.bytesFilled % r.elementSize;
                  if (n > 0) {
                      var a = r.byteOffset + r.bytesFilled;
                      var i = r.buffer.slice(a - n, a);
                      Re(e, i, 0, i.byteLength)
                  }
                  r.buffer = f(r.buffer);
                  r.bytesFilled -= n;
                  Ce(e._controlledReadableStream, r);
                  Le(e)
              }
              function Fe(e, t) {
                  var r = e._pendingPullIntos[0];
                  var n = e._controlledReadableStream;
                  if (n._state === "closed") {
                      if (t !== 0) {
                          throw new TypeError("bytesWritten must be 0 when calling respond() on a closed stream")
                      }
                      je(e, r)
                  } else {
                      _(n._state === "readable");
                      De(e, t, r)
                  }
              }
              function Ne(e) {
                  var t = e._pendingPullIntos.shift();
                  Ie(e);
                  return t
              }
              function Me(e) {
                  var t = e._controlledReadableStream;
                  if (t._state !== "readable") {
                      return false
                  }
                  if (e._closeRequested === true) {
                      return false
                  }
                  if (e._started === false) {
                      return false
                  }
                  if (ee(t) === true && Z(t) > 0) {
                      return true
                  }
                  if ($(t) === true && K(t) > 0) {
                      return true
                  }
                  if (Be(e) > 0) {
                      return true
                  }
                  return false
              }
              function qe(e) {
                  var t = e._controlledReadableStream;
                  _(e._closeRequested === false);
                  _(t._state === "readable");
                  if (e._queueTotalSize > 0) {
                      e._closeRequested = true;
                      return
                  }
                  if (e._pendingPullIntos.length > 0) {
                      var r = e._pendingPullIntos[0];
                      if (r.bytesFilled > 0) {
                          var n = new TypeError("Insufficient bytes to fill elements in the given buffer");
                          We(e, n);
                          throw n
                      }
                  }
                  Y(t)
              }
              function Ue(e, t) {
                  var r = e._controlledReadableStream;
                  _(e._closeRequested === false);
                  _(r._state === "readable");
                  var n = t.buffer;
                  var a = t.byteOffset;
                  var i = t.byteLength;
                  var s = f(n);
                  if (ee(r) === true) {
                      if (Z(r) === 0) {
                          Re(e, s, a, i)
                      } else {
                          _(e._queue.length === 0);
                          var o = new Uint8Array(s,a,i);
                          Q(r, o, false)
                      }
                  } else if ($(r) === true) {
                      Re(e, s, a, i);
                      Le(e)
                  } else {
                      _(q(r) === false, "stream must not be locked");
                      Re(e, s, a, i)
                  }
              }
              function We(e, t) {
                  var r = e._controlledReadableStream;
                  _(r._state === "readable");
                  Pe(e);
                  P(e);
                  V(r, t)
              }
              function Be(e) {
                  var t = e._controlledReadableStream;
                  var r = t._state;
                  if (r === "errored") {
                      return null
                  }
                  if (r === "closed") {
                      return 0
                  }
                  return e._strategyHWM - e._queueTotalSize
              }
              function ze(e, t) {
                  t = Number(t);
                  if (l(t) === false) {
                      throw new RangeError("bytesWritten must be a finite")
                  }
                  _(e._pendingPullIntos.length > 0);
                  Fe(e, t)
              }
              function Ge(e, t) {
                  _(e._pendingPullIntos.length > 0);
                  var r = e._pendingPullIntos[0];
                  if (r.byteOffset + r.bytesFilled !== t.byteOffset) {
                      throw new RangeError("The region specified by view does not match byobRequest")
                  }
                  if (r.byteLength !== t.byteLength) {
                      throw new RangeError("The buffer of view has different capacity than byobRequest")
                  }
                  r.buffer = t.buffer;
                  Fe(e, t.byteLength)
              }
              function He(e) {
                  return new TypeError("ReadableStream.prototype." + e + " can only be used on a ReadableStream")
              }
              function Xe(e) {
                  return new TypeError("Cannot " + e + " a stream using a released reader")
              }
              function Ye(e) {
                  return new TypeError("ReadableStreamDefaultReader.prototype." + e + " can only be used on a ReadableStreamDefaultReader")
              }
              function Ve(e) {
                  e._closedPromise = new Promise(function(t, r) {
                      e._closedPromise_resolve = t;
                      e._closedPromise_reject = r
                  }
                  )
              }
              function Je(e, t) {
                  e._closedPromise = Promise.reject(t);
                  e._closedPromise_resolve = undefined;
                  e._closedPromise_reject = undefined
              }
              function Qe(e) {
                  e._closedPromise = Promise.resolve(undefined);
                  e._closedPromise_resolve = undefined;
                  e._closedPromise_reject = undefined
              }
              function Ke(e, t) {
                  _(e._closedPromise_resolve !== undefined);
                  _(e._closedPromise_reject !== undefined);
                  e._closedPromise_reject(t);
                  e._closedPromise_resolve = undefined;
                  e._closedPromise_reject = undefined
              }
              function Ze(e, t) {
                  _(e._closedPromise_resolve === undefined);
                  _(e._closedPromise_reject === undefined);
                  e._closedPromise = Promise.reject(t)
              }
              function $e(e) {
                  _(e._closedPromise_resolve !== undefined);
                  _(e._closedPromise_reject !== undefined);
                  e._closedPromise_resolve(undefined);
                  e._closedPromise_resolve = undefined;
                  e._closedPromise_reject = undefined
              }
              function et(e) {
                  return new TypeError("ReadableStreamBYOBReader.prototype." + e + " can only be used on a ReadableStreamBYOBReader")
              }
              function tt(e) {
                  return new TypeError("ReadableStreamDefaultController.prototype." + e + " can only be used on a ReadableStreamDefaultController")
              }
              function rt(e) {
                  return new TypeError("ReadableStreamBYOBRequest.prototype." + e + " can only be used on a ReadableStreamBYOBRequest")
              }
              function nt(e) {
                  return new TypeError("ReadableByteStreamController.prototype." + e + " can only be used on a ReadableByteStreamController")
              }
              function at(e) {
                  try {
                      Promise.prototype.then.call(e, undefined, function() {})
                  } catch (e) {}
              }
          }
          , function(e, t, r) {
              "use strict";
              var n = r(6);
              var a = r(4);
              var i = r(2);
              t.TransformStream = n.TransformStream;
              t.ReadableStream = a.ReadableStream;
              t.IsReadableStreamDisturbed = a.IsReadableStreamDisturbed;
              t.ReadableStreamDefaultControllerClose = a.ReadableStreamDefaultControllerClose;
              t.ReadableStreamDefaultControllerEnqueue = a.ReadableStreamDefaultControllerEnqueue;
              t.ReadableStreamDefaultControllerError = a.ReadableStreamDefaultControllerError;
              t.ReadableStreamDefaultControllerGetDesiredSize = a.ReadableStreamDefaultControllerGetDesiredSize;
              t.AcquireWritableStreamDefaultWriter = i.AcquireWritableStreamDefaultWriter;
              t.IsWritableStream = i.IsWritableStream;
              t.IsWritableStreamLocked = i.IsWritableStreamLocked;
              t.WritableStream = i.WritableStream;
              t.WritableStreamAbort = i.WritableStreamAbort;
              t.WritableStreamDefaultControllerError = i.WritableStreamDefaultControllerError;
              t.WritableStreamDefaultWriterCloseWithErrorPropagation = i.WritableStreamDefaultWriterCloseWithErrorPropagation;
              t.WritableStreamDefaultWriterRelease = i.WritableStreamDefaultWriterRelease;
              t.WritableStreamDefaultWriterWrite = i.WritableStreamDefaultWriterWrite
          }
          , function(e, t, r) {
              "use strict";
              var n = function() {
                  function e(e, t) {
                      for (var r = 0; r < t.length; r++) {
                          var n = t[r];
                          n.enumerable = n.enumerable || false;
                          n.configurable = true;
                          if ("value"in n)
                              n.writable = true;
                          Object.defineProperty(e, n.key, n)
                      }
                  }
                  return function(t, r, n) {
                      if (r)
                          e(t.prototype, r);
                      if (n)
                          e(t, n);
                      return t
                  }
              }();
              function a(e, t) {
                  if (!(e instanceof t)) {
                      throw new TypeError("Cannot call a class as a function")
                  }
              }
              var i = r(1)
                , s = i.assert;
              var o = r(0)
                , l = o.InvokeOrNoop
                , u = o.PromiseInvokeOrPerformFallback
                , c = o.PromiseInvokeOrNoop
                , f = o.typeIsObject;
              var d = r(4)
                , h = d.ReadableStream
                , p = d.ReadableStreamDefaultControllerClose
                , v = d.ReadableStreamDefaultControllerEnqueue
                , m = d.ReadableStreamDefaultControllerError
                , g = d.ReadableStreamDefaultControllerGetDesiredSize;
              var b = r(2)
                , _ = b.WritableStream
                , y = b.WritableStreamDefaultControllerError;
              function A(e) {
                  if (e._errored === true) {
                      throw new TypeError("TransformStream is already errored")
                  }
                  if (e._readableClosed === true) {
                      throw new TypeError("Readable side is already closed")
                  }
                  P(e)
              }
              function S(e, t) {
                  if (e._errored === true) {
                      throw new TypeError("TransformStream is already errored")
                  }
                  if (e._readableClosed === true) {
                      throw new TypeError("Readable side is already closed")
                  }
                  var r = e._readableController;
                  try {
                      v(r, t)
                  } catch (t) {
                      e._readableClosed = true;
                      C(e, t);
                      throw e._storedError
                  }
                  var n = g(r);
                  var a = n <= 0;
                  if (a === true && e._backpressure === false) {
                      x(e, true)
                  }
              }
              function w(e, t) {
                  if (e._errored === true) {
                      throw new TypeError("TransformStream is already errored")
                  }
                  k(e, t)
              }
              function P(e) {
                  s(e._errored === false);
                  s(e._readableClosed === false);
                  try {
                      p(e._readableController)
                  } catch (e) {
                      s(false)
                  }
                  e._readableClosed = true
              }
              function C(e, t) {
                  if (e._errored === false) {
                      k(e, t)
                  }
              }
              function k(e, t) {
                  s(e._errored === false);
                  e._errored = true;
                  e._storedError = t;
                  if (e._writableDone === false) {
                      y(e._writableController, t)
                  }
                  if (e._readableClosed === false) {
                      m(e._readableController, t)
                  }
              }
              function R(e) {
                  s(e._backpressureChangePromise !== undefined, "_backpressureChangePromise should have been initialized");
                  if (e._backpressure === false) {
                      return Promise.resolve()
                  }
                  s(e._backpressure === true, "_backpressure should have been initialized");
                  return e._backpressureChangePromise
              }
              function x(e, t) {
                  s(e._backpressure !== t, "TransformStreamSetBackpressure() should be called only when backpressure is changed");
                  if (e._backpressureChangePromise !== undefined) {
                      e._backpressureChangePromise_resolve(t)
                  }
                  e._backpressureChangePromise = new Promise(function(t) {
                      e._backpressureChangePromise_resolve = t
                  }
                  );
                  e._backpressureChangePromise.then(function(e) {
                      s(e !== t, "_backpressureChangePromise should be fulfilled only when backpressure is changed")
                  });
                  e._backpressure = t
              }
              function T(e, t) {
                  var r = t._controlledTransformStream;
                  S(r, e);
                  return Promise.resolve()
              }
              function E(e, t) {
                  s(e._errored === false);
                  s(e._transforming === false);
                  s(e._backpressure === false);
                  e._transforming = true;
                  var r = e._transformer;
                  var n = e._transformStreamController;
                  var a = u(r, "transform", [t, n], T, [t, n]);
                  return a.then(function() {
                      e._transforming = false;
                      return R(e)
                  }, function(t) {
                      C(e, t);
                      return Promise.reject(t)
                  })
              }
              function I(e) {
                  if (!f(e)) {
                      return false
                  }
                  if (!Object.prototype.hasOwnProperty.call(e, "_controlledTransformStream")) {
                      return false
                  }
                  return true
              }
              function L(e) {
                  if (!f(e)) {
                      return false
                  }
                  if (!Object.prototype.hasOwnProperty.call(e, "_transformStreamController")) {
                      return false
                  }
                  return true
              }
              var O = function() {
                  function e(t, r) {
                      a(this, e);
                      this._transformStream = t;
                      this._startPromise = r
                  }
                  n(e, [{
                      key: "start",
                      value: function e(t) {
                          var r = this._transformStream;
                          r._writableController = t;
                          return this._startPromise.then(function() {
                              return R(r)
                          })
                      }
                  }, {
                      key: "write",
                      value: function e(t) {
                          var r = this._transformStream;
                          return E(r, t)
                      }
                  }, {
                      key: "abort",
                      value: function e() {
                          var t = this._transformStream;
                          t._writableDone = true;
                          k(t, new TypeError("Writable side aborted"))
                      }
                  }, {
                      key: "close",
                      value: function e() {
                          var t = this._transformStream;
                          s(t._transforming === false);
                          t._writableDone = true;
                          var r = c(t._transformer, "flush", [t._transformStreamController]);
                          return r.then(function() {
                              if (t._errored === true) {
                                  return Promise.reject(t._storedError)
                              }
                              if (t._readableClosed === false) {
                                  P(t)
                              }
                              return Promise.resolve()
                          }).catch(function(e) {
                              C(t, e);
                              return Promise.reject(t._storedError)
                          })
                      }
                  }]);
                  return e
              }();
              var j = function() {
                  function e(t, r) {
                      a(this, e);
                      this._transformStream = t;
                      this._startPromise = r
                  }
                  n(e, [{
                      key: "start",
                      value: function e(t) {
                          var r = this._transformStream;
                          r._readableController = t;
                          return this._startPromise.then(function() {
                              s(r._backpressureChangePromise !== undefined, "_backpressureChangePromise should have been initialized");
                              if (r._backpressure === true) {
                                  return Promise.resolve()
                              }
                              s(r._backpressure === false, "_backpressure should have been initialized");
                              return r._backpressureChangePromise
                          })
                      }
                  }, {
                      key: "pull",
                      value: function e() {
                          var t = this._transformStream;
                          s(t._backpressure === true, "pull() should be never called while _backpressure is false");
                          s(t._backpressureChangePromise !== undefined, "_backpressureChangePromise should have been initialized");
                          x(t, false);
                          return t._backpressureChangePromise
                      }
                  }, {
                      key: "cancel",
                      value: function e() {
                          var t = this._transformStream;
                          t._readableClosed = true;
                          k(t, new TypeError("Readable side canceled"))
                      }
                  }]);
                  return e
              }();
              var D = function() {
                  function e(t) {
                      a(this, e);
                      if (L(t) === false) {
                          throw new TypeError("TransformStreamDefaultController can only be " + "constructed with a TransformStream instance")
                      }
                      if (t._transformStreamController !== undefined) {
                          throw new TypeError("TransformStreamDefaultController instances can " + "only be created by the TransformStream constructor")
                      }
                      this._controlledTransformStream = t
                  }
                  n(e, [{
                      key: "enqueue",
                      value: function e(t) {
                          if (I(this) === false) {
                              throw N("enqueue")
                          }
                          S(this._controlledTransformStream, t)
                      }
                  }, {
                      key: "close",
                      value: function e() {
                          if (I(this) === false) {
                              throw N("close")
                          }
                          A(this._controlledTransformStream)
                      }
                  }, {
                      key: "error",
                      value: function e(t) {
                          if (I(this) === false) {
                              throw N("error")
                          }
                          w(this._controlledTransformStream, t)
                      }
                  }, {
                      key: "desiredSize",
                      get: function e() {
                          if (I(this) === false) {
                              throw N("desiredSize")
                          }
                          var t = this._controlledTransformStream;
                          var r = t._readableController;
                          return g(r)
                      }
                  }]);
                  return e
              }();
              var F = function() {
                  function e() {
                      var t = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
                      a(this, e);
                      this._transformer = t;
                      var r = t.readableStrategy
                        , n = t.writableStrategy;
                      this._transforming = false;
                      this._errored = false;
                      this._storedError = undefined;
                      this._writableController = undefined;
                      this._readableController = undefined;
                      this._transformStreamController = undefined;
                      this._writableDone = false;
                      this._readableClosed = false;
                      this._backpressure = undefined;
                      this._backpressureChangePromise = undefined;
                      this._backpressureChangePromise_resolve = undefined;
                      this._transformStreamController = new D(this);
                      var i = void 0;
                      var o = new Promise(function(e) {
                          i = e
                      }
                      );
                      var u = new j(this,o);
                      this._readable = new h(u,r);
                      var c = new O(this,o);
                      this._writable = new _(c,n);
                      s(this._writableController !== undefined);
                      s(this._readableController !== undefined);
                      var f = g(this._readableController);
                      x(this, f <= 0);
                      var d = this;
                      var p = l(t, "start", [d._transformStreamController]);
                      i(p);
                      o.catch(function(e) {
                          if (d._errored === false) {
                              d._errored = true;
                              d._storedError = e
                          }
                      })
                  }
                  n(e, [{
                      key: "readable",
                      get: function e() {
                          if (L(this) === false) {
                              throw M("readable")
                          }
                          return this._readable
                      }
                  }, {
                      key: "writable",
                      get: function e() {
                          if (L(this) === false) {
                              throw M("writable")
                          }
                          return this._writable
                      }
                  }]);
                  return e
              }();
              e.exports = {
                  TransformStream: F
              };
              function N(e) {
                  return new TypeError("TransformStreamDefaultController.prototype." + e + " can only be used on a TransformStreamDefaultController")
              }
              function M(e) {
                  return new TypeError("TransformStream.prototype." + e + " can only be used on a TransformStream")
              }
          }
          , function(e, t, r) {
              e.exports = r(5)
          }
          ]))
      }
      , function(e, t, r) {
          "use strict";
          Object.defineProperty(t, "__esModule", {
              value: true
          });
          t.CanvasGraphics = undefined;
          var n = r(0);
          var a = r(13);
          var i = r(7);
          var s = 16;
          var o = 100;
          var l = 4096;
          var u = .65;
          var c = true;
          var f = 1e3;
          var d = 16;
          var h = {
              get value() {
                  return (0,
                  n.shadow)(h, "value", (0,
                  n.isLittleEndian)())
              }
          };
          function p(e) {
              if (!e.mozCurrentTransform) {
                  e._originalSave = e.save;
                  e._originalRestore = e.restore;
                  e._originalRotate = e.rotate;
                  e._originalScale = e.scale;
                  e._originalTranslate = e.translate;
                  e._originalTransform = e.transform;
                  e._originalSetTransform = e.setTransform;
                  e._transformMatrix = e._transformMatrix || [1, 0, 0, 1, 0, 0];
                  e._transformStack = [];
                  Object.defineProperty(e, "mozCurrentTransform", {
                      get: function e() {
                          return this._transformMatrix
                      }
                  });
                  Object.defineProperty(e, "mozCurrentTransformInverse", {
                      get: function e() {
                          var t = this._transformMatrix;
                          var r = t[0]
                            , n = t[1]
                            , a = t[2]
                            , i = t[3]
                            , s = t[4]
                            , o = t[5];
                          var l = r * i - n * a;
                          var u = n * a - r * i;
                          return [i / l, n / u, a / u, r / l, (i * s - a * o) / u, (n * s - r * o) / l]
                      }
                  });
                  e.save = function e() {
                      var t = this._transformMatrix;
                      this._transformStack.push(t);
                      this._transformMatrix = t.slice(0, 6);
                      this._originalSave()
                  }
                  ;
                  e.restore = function e() {
                      var t = this._transformStack.pop();
                      if (t) {
                          this._transformMatrix = t;
                          this._originalRestore()
                      }
                  }
                  ;
                  e.translate = function e(t, r) {
                      var n = this._transformMatrix;
                      n[4] = n[0] * t + n[2] * r + n[4];
                      n[5] = n[1] * t + n[3] * r + n[5];
                      this._originalTranslate(t, r)
                  }
                  ;
                  e.scale = function e(t, r) {
                      var n = this._transformMatrix;
                      n[0] = n[0] * t;
                      n[1] = n[1] * t;
                      n[2] = n[2] * r;
                      n[3] = n[3] * r;
                      this._originalScale(t, r)
                  }
                  ;
                  e.transform = function t(r, n, a, i, s, o) {
                      var l = this._transformMatrix;
                      this._transformMatrix = [l[0] * r + l[2] * n, l[1] * r + l[3] * n, l[0] * a + l[2] * i, l[1] * a + l[3] * i, l[0] * s + l[2] * o + l[4], l[1] * s + l[3] * o + l[5]];
                      e._originalTransform(r, n, a, i, s, o)
                  }
                  ;
                  e.setTransform = function t(r, n, a, i, s, o) {
                      this._transformMatrix = [r, n, a, i, s, o];
                      e._originalSetTransform(r, n, a, i, s, o)
                  }
                  ;
                  e.rotate = function e(t) {
                      var r = Math.cos(t);
                      var n = Math.sin(t);
                      var a = this._transformMatrix;
                      this._transformMatrix = [a[0] * r + a[2] * n, a[1] * r + a[3] * n, a[0] * -n + a[2] * r, a[1] * -n + a[3] * r, a[4], a[5]];
                      this._originalRotate(t)
                  }
              }
          }
          var v = function e() {
              function t(e) {
                  this.canvasFactory = e;
                  this.cache = Object.create(null)
              }
              t.prototype = {
                  getCanvas: function e(t, r, n, a) {
                      var i;
                      if (this.cache[t] !== undefined) {
                          i = this.cache[t];
                          this.canvasFactory.reset(i, r, n);
                          i.context.setTransform(1, 0, 0, 1, 0, 0)
                      } else {
                          i = this.canvasFactory.create(r, n);
                          this.cache[t] = i
                      }
                      if (a) {
                          p(i.context)
                      }
                      return i
                  },
                  clear: function e() {
                      for (var t in this.cache) {
                          var r = this.cache[t];
                          this.canvasFactory.destroy(r);
                          delete this.cache[t]
                      }
                  }
              };
              return t
          }();
          function m(e) {
              var t = 1e3;
              var r = e.width
                , n = e.height;
              var a, i, s, o = r + 1;
              var l = new Uint8Array(o * (n + 1));
              var u = new Uint8Array([0, 2, 4, 0, 1, 0, 5, 4, 8, 10, 0, 8, 0, 2, 1, 0]);
              var c = r + 7 & ~7
                , f = e.data;
              var d = new Uint8Array(c * n), h = 0, p;
              for (a = 0,
              p = f.length; a < p; a++) {
                  var v = 128
                    , m = f[a];
                  while (v > 0) {
                      d[h++] = m & v ? 0 : 255;
                      v >>= 1
                  }
              }
              var g = 0;
              h = 0;
              if (d[h] !== 0) {
                  l[0] = 1;
                  ++g
              }
              for (i = 1; i < r; i++) {
                  if (d[h] !== d[h + 1]) {
                      l[i] = d[h] ? 2 : 1;
                      ++g
                  }
                  h++
              }
              if (d[h] !== 0) {
                  l[i] = 2;
                  ++g
              }
              for (a = 1; a < n; a++) {
                  h = a * c;
                  s = a * o;
                  if (d[h - c] !== d[h]) {
                      l[s] = d[h] ? 1 : 8;
                      ++g
                  }
                  var b = (d[h] ? 4 : 0) + (d[h - c] ? 8 : 0);
                  for (i = 1; i < r; i++) {
                      b = (b >> 2) + (d[h + 1] ? 4 : 0) + (d[h - c + 1] ? 8 : 0);
                      if (u[b]) {
                          l[s + i] = u[b];
                          ++g
                      }
                      h++
                  }
                  if (d[h - c] !== d[h]) {
                      l[s + i] = d[h] ? 2 : 4;
                      ++g
                  }
                  if (g > t) {
                      return null
                  }
              }
              h = c * (n - 1);
              s = a * o;
              if (d[h] !== 0) {
                  l[s] = 8;
                  ++g
              }
              for (i = 1; i < r; i++) {
                  if (d[h] !== d[h + 1]) {
                      l[s + i] = d[h] ? 4 : 8;
                      ++g
                  }
                  h++
              }
              if (d[h] !== 0) {
                  l[s + i] = 4;
                  ++g
              }
              if (g > t) {
                  return null
              }
              var _ = new Int32Array([0, o, -1, 0, -o, 0, 0, 0, 1]);
              var y = [];
              for (a = 0; g && a <= n; a++) {
                  var A = a * o;
                  var S = A + r;
                  while (A < S && !l[A]) {
                      A++
                  }
                  if (A === S) {
                      continue
                  }
                  var w = [A % o, a];
                  var P = l[A], C = A, k;
                  do {
                      var R = _[P];
                      do {
                          A += R
                      } while (!l[A]);
                      k = l[A];
                      if (k !== 5 && k !== 10) {
                          P = k;
                          l[A] = 0
                      } else {
                          P = k & 51 * P >> 4;
                          l[A] &= P >> 2 | P << 2
                      }
                      w.push(A % o);
                      w.push(A / o | 0);
                      --g
                  } while (C !== A);
                  y.push(w);
                  --a
              }
              var x = function e(t) {
                  t.save();
                  t.scale(1 / r, -1 / n);
                  t.translate(0, -n);
                  t.beginPath();
                  for (var a = 0, i = y.length; a < i; a++) {
                      var s = y[a];
                      t.moveTo(s[0], s[1]);
                      for (var o = 2, l = s.length; o < l; o += 2) {
                          t.lineTo(s[o], s[o + 1])
                      }
                  }
                  t.fill();
                  t.beginPath();
                  t.restore()
              };
              return x
          }
          var g = function e() {
              function t() {
                  this.alphaIsShape = false;
                  this.fontSize = 0;
                  this.fontSizeScale = 1;
                  this.textMatrix = n.IDENTITY_MATRIX;
                  this.textMatrixScale = 1;
                  this.fontMatrix = n.FONT_IDENTITY_MATRIX;
                  this.leading = 0;
                  this.x = 0;
                  this.y = 0;
                  this.lineX = 0;
                  this.lineY = 0;
                  this.charSpacing = 0;
                  this.wordSpacing = 0;
                  this.textHScale = 1;
                  this.textRenderingMode = n.TextRenderingMode.FILL;
                  this.textRise = 0;
                  this.fillColor = "#000000";
                  this.strokeColor = "#000000";
                  this.patternFill = false;
                  this.fillAlpha = 1;
                  this.strokeAlpha = 1;
                  this.lineWidth = 1;
                  this.activeSMask = null;
                  this.resumeSMaskCtx = null
              }
              t.prototype = {
                  clone: function e() {
                      return Object.create(this)
                  },
                  setCurrentPoint: function e(t, r) {
                      this.x = t;
                      this.y = r
                  }
              };
              return t
          }();
          var b = function e() {
              var t = 15;
              var r = 10;
              function b(e, t, r, n, a) {
                  this.ctx = e;
                  this.current = new g;
                  this.stateStack = [];
                  this.pendingClip = null;
                  this.pendingEOFill = false;
                  this.res = null;
                  this.xobjs = null;
                  this.commonObjs = t;
                  this.objs = r;
                  this.canvasFactory = n;
                  this.imageLayer = a;
                  this.groupStack = [];
                  this.processingType3 = null;
                  this.baseTransform = null;
                  this.baseTransformStack = [];
                  this.groupLevel = 0;
                  this.smaskStack = [];
                  this.smaskCounter = 0;
                  this.tempSMask = null;
                  this.cachedCanvases = new v(this.canvasFactory);
                  if (e) {
                      p(e)
                  }
                  this.cachedGetSinglePixelWidth = null
              }
              function _(e, t) {
                  if (typeof ImageData !== "undefined" && t instanceof ImageData) {
                      e.putImageData(t, 0, 0);
                      return
                  }
                  var r = t.height
                    , a = t.width;
                  var i = r % d;
                  var s = (r - i) / d;
                  var o = i === 0 ? s : s + 1;
                  var l = e.createImageData(a, d);
                  var u = 0, c;
                  var f = t.data;
                  var p = l.data;
                  var v, m, g, b;
                  if (t.kind === n.ImageKind.GRAYSCALE_1BPP) {
                      var _ = f.byteLength;
                      var y = new Uint32Array(p.buffer,0,p.byteLength >> 2);
                      var A = y.length;
                      var S = a + 7 >> 3;
                      var w = 4294967295;
                      var P = h.value ? 4278190080 : 255;
                      for (v = 0; v < o; v++) {
                          g = v < s ? d : i;
                          c = 0;
                          for (m = 0; m < g; m++) {
                              var C = _ - u;
                              var k = 0;
                              var R = C > S ? a : C * 8 - 7;
                              var x = R & ~7;
                              var T = 0;
                              var E = 0;
                              for (; k < x; k += 8) {
                                  E = f[u++];
                                  y[c++] = E & 128 ? w : P;
                                  y[c++] = E & 64 ? w : P;
                                  y[c++] = E & 32 ? w : P;
                                  y[c++] = E & 16 ? w : P;
                                  y[c++] = E & 8 ? w : P;
                                  y[c++] = E & 4 ? w : P;
                                  y[c++] = E & 2 ? w : P;
                                  y[c++] = E & 1 ? w : P
                              }
                              for (; k < R; k++) {
                                  if (T === 0) {
                                      E = f[u++];
                                      T = 128
                                  }
                                  y[c++] = E & T ? w : P;
                                  T >>= 1
                              }
                          }
                          while (c < A) {
                              y[c++] = 0
                          }
                          e.putImageData(l, 0, v * d)
                      }
                  } else if (t.kind === n.ImageKind.RGBA_32BPP) {
                      m = 0;
                      b = a * d * 4;
                      for (v = 0; v < s; v++) {
                          p.set(f.subarray(u, u + b));
                          u += b;
                          e.putImageData(l, 0, m);
                          m += d
                      }
                      if (v < o) {
                          b = a * i * 4;
                          p.set(f.subarray(u, u + b));
                          e.putImageData(l, 0, m)
                      }
                  } else if (t.kind === n.ImageKind.RGB_24BPP) {
                      g = d;
                      b = a * g;
                      for (v = 0; v < o; v++) {
                          if (v >= s) {
                              g = i;
                              b = a * g
                          }
                          c = 0;
                          for (m = b; m--; ) {
                              p[c++] = f[u++];
                              p[c++] = f[u++];
                              p[c++] = f[u++];
                              p[c++] = 255
                          }
                          e.putImageData(l, 0, v * d)
                      }
                  } else {
                      throw new Error("bad image kind: " + t.kind)
                  }
              }
              function y(e, t) {
                  var r = t.height
                    , n = t.width;
                  var a = r % d;
                  var i = (r - a) / d;
                  var s = a === 0 ? i : i + 1;
                  var o = e.createImageData(n, d);
                  var l = 0;
                  var u = t.data;
                  var c = o.data;
                  for (var f = 0; f < s; f++) {
                      var h = f < i ? d : a;
                      var p = 3;
                      for (var v = 0; v < h; v++) {
                          var m = 0;
                          for (var g = 0; g < n; g++) {
                              if (!m) {
                                  var b = u[l++];
                                  m = 128
                              }
                              c[p] = b & m ? 0 : 255;
                              p += 4;
                              m >>= 1
                          }
                      }
                      e.putImageData(o, 0, f * d)
                  }
              }
              function A(e, t) {
                  var r = ["strokeStyle", "fillStyle", "fillRule", "globalAlpha", "lineWidth", "lineCap", "lineJoin", "miterLimit", "globalCompositeOperation", "font"];
                  for (var n = 0, a = r.length; n < a; n++) {
                      var i = r[n];
                      if (e[i] !== undefined) {
                          t[i] = e[i]
                      }
                  }
                  if (e.setLineDash !== undefined) {
                      t.setLineDash(e.getLineDash());
                      t.lineDashOffset = e.lineDashOffset
                  }
              }
              function S(e) {
                  e.strokeStyle = "#000000";
                  e.fillStyle = "#000000";
                  e.fillRule = "nonzero";
                  e.globalAlpha = 1;
                  e.lineWidth = 1;
                  e.lineCap = "butt";
                  e.lineJoin = "miter";
                  e.miterLimit = 10;
                  e.globalCompositeOperation = "source-over";
                  e.font = "10px sans-serif";
                  if (e.setLineDash !== undefined) {
                      e.setLineDash([]);
                      e.lineDashOffset = 0
                  }
              }
              function w(e, t, r, n) {
                  var a = e.length;
                  for (var i = 3; i < a; i += 4) {
                      var s = e[i];
                      if (s === 0) {
                          e[i - 3] = t;
                          e[i - 2] = r;
                          e[i - 1] = n
                      } else if (s < 255) {
                          var o = 255 - s;
                          e[i - 3] = e[i - 3] * s + t * o >> 8;
                          e[i - 2] = e[i - 2] * s + r * o >> 8;
                          e[i - 1] = e[i - 1] * s + n * o >> 8
                      }
                  }
              }
              function P(e, t, r) {
                  var n = e.length;
                  var a = 1 / 255;
                  for (var i = 3; i < n; i += 4) {
                      var s = r ? r[e[i]] : e[i];
                      t[i] = t[i] * s * a | 0
                  }
              }
              function C(e, t, r) {
                  var n = e.length;
                  for (var a = 3; a < n; a += 4) {
                      var i = e[a - 3] * 77 + e[a - 2] * 152 + e[a - 1] * 28;
                      t[a] = r ? t[a] * r[i >> 8] >> 8 : t[a] * i >> 16
                  }
              }
              function k(e, t, r, n, a, i, s) {
                  var o = !!i;
                  var l = o ? i[0] : 0;
                  var u = o ? i[1] : 0;
                  var c = o ? i[2] : 0;
                  var f;
                  if (a === "Luminosity") {
                      f = C
                  } else {
                      f = P
                  }
                  var d = 1048576;
                  var h = Math.min(n, Math.ceil(d / r));
                  for (var p = 0; p < n; p += h) {
                      var v = Math.min(h, n - p);
                      var m = e.getImageData(0, p, r, v);
                      var g = t.getImageData(0, p, r, v);
                      if (o) {
                          w(m.data, l, u, c)
                      }
                      f(m.data, g.data, s);
                      e.putImageData(g, 0, p)
                  }
              }
              function R(e, t, r) {
                  var n = t.canvas;
                  var a = t.context;
                  e.setTransform(t.scaleX, 0, 0, t.scaleY, t.offsetX, t.offsetY);
                  var s = t.backdrop || null;
                  if (!t.transferMap && i.WebGLUtils.isEnabled) {
                      var o = i.WebGLUtils.composeSMask(r.canvas, n, {
                          subtype: t.subtype,
                          backdrop: s
                      });
                      e.setTransform(1, 0, 0, 1, 0, 0);
                      e.drawImage(o, t.offsetX, t.offsetY);
                      return
                  }
                  k(a, r, n.width, n.height, t.subtype, s, t.transferMap);
                  e.drawImage(n, 0, 0)
              }
              var x = ["butt", "round", "square"];
              var T = ["miter", "round", "bevel"];
              var E = {};
              var I = {};
              b.prototype = {
                  beginDrawing: function e(t) {
                      var r = t.transform
                        , n = t.viewport
                        , a = t.transparency
                        , i = t.background
                        , s = i === undefined ? null : i;
                      var o = this.ctx.canvas.width;
                      var l = this.ctx.canvas.height;
                      this.ctx.save();
                      this.ctx.fillStyle = s || "rgb(255, 255, 255)";
                      this.ctx.fillRect(0, 0, o, l);
                      this.ctx.restore();
                      if (a) {
                          var u = this.cachedCanvases.getCanvas("transparent", o, l, true);
                          this.compositeCtx = this.ctx;
                          this.transparentCanvas = u.canvas;
                          this.ctx = u.context;
                          this.ctx.save();
                          this.ctx.transform.apply(this.ctx, this.compositeCtx.mozCurrentTransform)
                      }
                      this.ctx.save();
                      S(this.ctx);
                      if (r) {
                          this.ctx.transform.apply(this.ctx, r)
                      }
                      this.ctx.transform.apply(this.ctx, n.transform);
                      this.baseTransform = this.ctx.mozCurrentTransform.slice();
                      if (this.imageLayer) {
                          this.imageLayer.beginLayout()
                      }
                  },
                  executeOperatorList: function e(a, i, s, o) {
                      var l = a.argsArray;
                      var u = a.fnArray;
                      var c = i || 0;
                      var f = l.length;
                      if (f === c) {
                          return c
                      }
                      var d = f - c > r && typeof s === "function";
                      var h = d ? Date.now() + t : 0;
                      var p = 0;
                      var v = this.commonObjs;
                      var m = this.objs;
                      var g;
                      while (true) {
                          if (o !== undefined && c === o.nextBreakPoint) {
                              o.breakIt(c, s);
                              return c
                          }
                          g = u[c];
                          if (g !== n.OPS.dependency) {
                              this[g].apply(this, l[c])
                          } else {
                              var b = l[c];
                              for (var _ = 0, y = b.length; _ < y; _++) {
                                  var A = b[_];
                                  var S = A[0] === "g" && A[1] === "_";
                                  var w = S ? v : m;
                                  if (!w.isResolved(A)) {
                                      w.get(A, s);
                                      return c
                                  }
                              }
                          }
                          c++;
                          if (c === f) {
                              return c
                          }
                          if (d && ++p > r) {
                              if (Date.now() > h) {
                                  s();
                                  return c
                              }
                              p = 0
                          }
                      }
                  },
                  endDrawing: function e() {
                      if (this.current.activeSMask !== null) {
                          this.endSMaskGroup()
                      }
                      this.ctx.restore();
                      if (this.transparentCanvas) {
                          this.ctx = this.compositeCtx;
                          this.ctx.save();
                          this.ctx.setTransform(1, 0, 0, 1, 0, 0);
                          this.ctx.drawImage(this.transparentCanvas, 0, 0);
                          this.ctx.restore();
                          this.transparentCanvas = null
                      }
                      this.cachedCanvases.clear();
                      i.WebGLUtils.clear();
                      if (this.imageLayer) {
                          this.imageLayer.endLayout()
                      }
                  },
                  setLineWidth: function e(t) {
                      this.current.lineWidth = t;
                      this.ctx.lineWidth = t
                  },
                  setLineCap: function e(t) {
                      this.ctx.lineCap = x[t]
                  },
                  setLineJoin: function e(t) {
                      this.ctx.lineJoin = T[t]
                  },
                  setMiterLimit: function e(t) {
                      this.ctx.miterLimit = t
                  },
                  setDash: function e(t, r) {
                      var n = this.ctx;
                      if (n.setLineDash !== undefined) {
                          n.setLineDash(t);
                          n.lineDashOffset = r
                      }
                  },
                  setRenderingIntent: function e(t) {},
                  setFlatness: function e(t) {},
                  setGState: function e(t) {
                      for (var r = 0, n = t.length; r < n; r++) {
                          var a = t[r];
                          var i = a[0];
                          var s = a[1];
                          switch (i) {
                          case "LW":
                              this.setLineWidth(s);
                              break;
                          case "LC":
                              this.setLineCap(s);
                              break;
                          case "LJ":
                              this.setLineJoin(s);
                              break;
                          case "ML":
                              this.setMiterLimit(s);
                              break;
                          case "D":
                              this.setDash(s[0], s[1]);
                              break;
                          case "RI":
                              this.setRenderingIntent(s);
                              break;
                          case "FL":
                              this.setFlatness(s);
                              break;
                          case "Font":
                              this.setFont(s[0], s[1]);
                              break;
                          case "CA":
                              this.current.strokeAlpha = a[1];
                              break;
                          case "ca":
                              this.current.fillAlpha = a[1];
                              this.ctx.globalAlpha = a[1];
                              break;
                          case "BM":
                              this.ctx.globalCompositeOperation = s;
                              break;
                          case "SMask":
                              if (this.current.activeSMask) {
                                  if (this.stateStack.length > 0 && this.stateStack[this.stateStack.length - 1].activeSMask === this.current.activeSMask) {
                                      this.suspendSMaskGroup()
                                  } else {
                                      this.endSMaskGroup()
                                  }
                              }
                              this.current.activeSMask = s ? this.tempSMask : null;
                              if (this.current.activeSMask) {
                                  this.beginSMaskGroup()
                              }
                              this.tempSMask = null;
                              break
                          }
                      }
                  },
                  beginSMaskGroup: function e() {
                      var t = this.current.activeSMask;
                      var r = t.canvas.width;
                      var n = t.canvas.height;
                      var a = "smaskGroupAt" + this.groupLevel;
                      var i = this.cachedCanvases.getCanvas(a, r, n, true);
                      var s = this.ctx;
                      var o = s.mozCurrentTransform;
                      this.ctx.save();
                      var l = i.context;
                      l.scale(1 / t.scaleX, 1 / t.scaleY);
                      l.translate(-t.offsetX, -t.offsetY);
                      l.transform.apply(l, o);
                      t.startTransformInverse = l.mozCurrentTransformInverse;
                      A(s, l);
                      this.ctx = l;
                      this.setGState([["BM", "source-over"], ["ca", 1], ["CA", 1]]);
                      this.groupStack.push(s);
                      this.groupLevel++
                  },
                  suspendSMaskGroup: function e() {
                      var t = this.ctx;
                      this.groupLevel--;
                      this.ctx = this.groupStack.pop();
                      R(this.ctx, this.current.activeSMask, t);
                      this.ctx.restore();
                      this.ctx.save();
                      A(t, this.ctx);
                      this.current.resumeSMaskCtx = t;
                      var r = n.Util.transform(this.current.activeSMask.startTransformInverse, t.mozCurrentTransform);
                      this.ctx.transform.apply(this.ctx, r);
                      t.save();
                      t.setTransform(1, 0, 0, 1, 0, 0);
                      t.clearRect(0, 0, t.canvas.width, t.canvas.height);
                      t.restore()
                  },
                  resumeSMaskGroup: function e() {
                      var t = this.current.resumeSMaskCtx;
                      var r = this.ctx;
                      this.ctx = t;
                      this.groupStack.push(r);
                      this.groupLevel++
                  },
                  endSMaskGroup: function e() {
                      var t = this.ctx;
                      this.groupLevel--;
                      this.ctx = this.groupStack.pop();
                      R(this.ctx, this.current.activeSMask, t);
                      this.ctx.restore();
                      A(t, this.ctx);
                      var r = n.Util.transform(this.current.activeSMask.startTransformInverse, t.mozCurrentTransform);
                      this.ctx.transform.apply(this.ctx, r)
                  },
                  save: function e() {
                      this.ctx.save();
                      var t = this.current;
                      this.stateStack.push(t);
                      this.current = t.clone();
                      this.current.resumeSMaskCtx = null
                  },
                  restore: function e() {
                      if (this.current.resumeSMaskCtx) {
                          this.resumeSMaskGroup()
                      }
                      if (this.current.activeSMask !== null && (this.stateStack.length === 0 || this.stateStack[this.stateStack.length - 1].activeSMask !== this.current.activeSMask)) {
                          this.endSMaskGroup()
                      }
                      if (this.stateStack.length !== 0) {
                          this.current = this.stateStack.pop();
                          this.ctx.restore();
                          this.pendingClip = null;
                          this.cachedGetSinglePixelWidth = null
                      }
                  },
                  transform: function e(t, r, n, a, i, s) {
                      this.ctx.transform(t, r, n, a, i, s);
                      this.cachedGetSinglePixelWidth = null
                  },
                  constructPath: function e(t, r) {
                      var a = this.ctx;
                      var i = this.current;
                      var s = i.x
                        , o = i.y;
                      for (var l = 0, u = 0, c = t.length; l < c; l++) {
                          switch (t[l] | 0) {
                          case n.OPS.rectangle:
                              s = r[u++];
                              o = r[u++];
                              var f = r[u++];
                              var d = r[u++];
                              if (f === 0) {
                                  f = this.getSinglePixelWidth()
                              }
                              if (d === 0) {
                                  d = this.getSinglePixelWidth()
                              }
                              var h = s + f;
                              var p = o + d;
                              this.ctx.moveTo(s, o);
                              this.ctx.lineTo(h, o);
                              this.ctx.lineTo(h, p);
                              this.ctx.lineTo(s, p);
                              this.ctx.lineTo(s, o);
                              this.ctx.closePath();
                              break;
                          case n.OPS.moveTo:
                              s = r[u++];
                              o = r[u++];
                              a.moveTo(s, o);
                              break;
                          case n.OPS.lineTo:
                              s = r[u++];
                              o = r[u++];
                              a.lineTo(s, o);
                              break;
                          case n.OPS.curveTo:
                              s = r[u + 4];
                              o = r[u + 5];
                              a.bezierCurveTo(r[u], r[u + 1], r[u + 2], r[u + 3], s, o);
                              u += 6;
                              break;
                          case n.OPS.curveTo2:
                              a.bezierCurveTo(s, o, r[u], r[u + 1], r[u + 2], r[u + 3]);
                              s = r[u + 2];
                              o = r[u + 3];
                              u += 4;
                              break;
                          case n.OPS.curveTo3:
                              s = r[u + 2];
                              o = r[u + 3];
                              a.bezierCurveTo(r[u], r[u + 1], s, o, s, o);
                              u += 4;
                              break;
                          case n.OPS.closePath:
                              a.closePath();
                              break
                          }
                      }
                      i.setCurrentPoint(s, o)
                  },
                  closePath: function e() {
                      this.ctx.closePath()
                  },
                  stroke: function e(t) {
                      t = typeof t !== "undefined" ? t : true;
                      var r = this.ctx;
                      var n = this.current.strokeColor;
                      r.lineWidth = Math.max(this.getSinglePixelWidth() * u, this.current.lineWidth);
                      r.globalAlpha = this.current.strokeAlpha;
                      if (n && n.hasOwnProperty("type") && n.type === "Pattern") {
                          r.save();
                          r.strokeStyle = n.getPattern(r, this);
                          r.stroke();
                          r.restore()
                      } else {
                          r.stroke()
                      }
                      if (t) {
                          this.consumePath()
                      }
                      r.globalAlpha = this.current.fillAlpha
                  },
                  closeStroke: function e() {
                      this.closePath();
                      this.stroke()
                  },
                  fill: function e(t) {
                      t = typeof t !== "undefined" ? t : true;
                      var r = this.ctx;
                      var n = this.current.fillColor;
                      var a = this.current.patternFill;
                      var i = false;
                      if (a) {
                          r.save();
                          if (this.baseTransform) {
                              r.setTransform.apply(r, this.baseTransform)
                          }
                          r.fillStyle = n.getPattern(r, this);
                          i = true
                      }
                      if (this.pendingEOFill) {
                          r.fill("evenodd");
                          this.pendingEOFill = false
                      } else {
                          r.fill()
                      }
                      if (i) {
                          r.restore()
                      }
                      if (t) {
                          this.consumePath()
                      }
                  },
                  eoFill: function e() {
                      this.pendingEOFill = true;
                      this.fill()
                  },
                  fillStroke: function e() {
                      this.fill(false);
                      this.stroke(false);
                      this.consumePath()
                  },
                  eoFillStroke: function e() {
                      this.pendingEOFill = true;
                      this.fillStroke()
                  },
                  closeFillStroke: function e() {
                      this.closePath();
                      this.fillStroke()
                  },
                  closeEOFillStroke: function e() {
                      this.pendingEOFill = true;
                      this.closePath();
                      this.fillStroke()
                  },
                  endPath: function e() {
                      this.consumePath()
                  },
                  clip: function e() {
                      this.pendingClip = E
                  },
                  eoClip: function e() {
                      this.pendingClip = I
                  },
                  beginText: function e() {
                      this.current.textMatrix = n.IDENTITY_MATRIX;
                      this.current.textMatrixScale = 1;
                      this.current.x = this.current.lineX = 0;
                      this.current.y = this.current.lineY = 0
                  },
                  endText: function e() {
                      var t = this.pendingTextPaths;
                      var r = this.ctx;
                      if (t === undefined) {
                          r.beginPath();
                          return
                      }
                      r.save();
                      r.beginPath();
                      for (var n = 0; n < t.length; n++) {
                          var a = t[n];
                          r.setTransform.apply(r, a.transform);
                          r.translate(a.x, a.y);
                          a.addToPath(r, a.fontSize)
                      }
                      r.restore();
                      r.clip();
                      r.beginPath();
                      delete this.pendingTextPaths
                  },
                  setCharSpacing: function e(t) {
                      this.current.charSpacing = t
                  },
                  setWordSpacing: function e(t) {
                      this.current.wordSpacing = t
                  },
                  setHScale: function e(t) {
                      this.current.textHScale = t / 100
                  },
                  setLeading: function e(t) {
                      this.current.leading = -t
                  },
                  setFont: function e(t, r) {
                      var a = this.commonObjs.get(t);
                      var i = this.current;
                      if (!a) {
                          throw new Error("Can't find font for " + t)
                      }
                      i.fontMatrix = a.fontMatrix ? a.fontMatrix : n.FONT_IDENTITY_MATRIX;
                      if (i.fontMatrix[0] === 0 || i.fontMatrix[3] === 0) {
                          (0,
                          n.warn)("Invalid font matrix for font " + t)
                      }
                      if (r < 0) {
                          r = -r;
                          i.fontDirection = -1
                      } else {
                          i.fontDirection = 1
                      }
                      this.current.font = a;
                      this.current.fontSize = r;
                      if (a.isType3Font) {
                          return
                      }
                      var l = a.loadedName || "sans-serif";
                      var u = a.black ? "900" : a.bold ? "bold" : "normal";
                      var c = a.italic ? "italic" : "normal";
                      var f = '"' + l + '", ' + a.fallbackName;
                      var d = r < s ? s : r > o ? o : r;
                      this.current.fontSizeScale = r / d;
                      var h = c + " " + u + " " + d + "px " + f;
                      this.ctx.font = h
                  },
                  setTextRenderingMode: function e(t) {
                      this.current.textRenderingMode = t
                  },
                  setTextRise: function e(t) {
                      this.current.textRise = t
                  },
                  moveText: function e(t, r) {
                      this.current.x = this.current.lineX += t;
                      this.current.y = this.current.lineY += r
                  },
                  setLeadingMoveText: function e(t, r) {
                      this.setLeading(-r);
                      this.moveText(t, r)
                  },
                  setTextMatrix: function e(t, r, n, a, i, s) {
                      this.current.textMatrix = [t, r, n, a, i, s];
                      this.current.textMatrixScale = Math.sqrt(t * t + r * r);
                      this.current.x = this.current.lineX = 0;
                      this.current.y = this.current.lineY = 0
                  },
                  nextLine: function e() {
                      this.moveText(0, this.current.leading)
                  },
                  paintChar: function e(t, r, a) {
                      var i = this.ctx;
                      var s = this.current;
                      var o = s.font;
                      var l = s.textRenderingMode;
                      var u = s.fontSize / s.fontSizeScale;
                      var c = l & n.TextRenderingMode.FILL_STROKE_MASK;
                      var f = !!(l & n.TextRenderingMode.ADD_TO_PATH_FLAG);
                      var d;
                      if (o.disableFontFace || f) {
                          d = o.getPathGenerator(this.commonObjs, t)
                      }
                      if (o.disableFontFace) {
                          i.save();
                          i.translate(r, a);
                          i.beginPath();
                          d(i, u);
                          if (c === n.TextRenderingMode.FILL || c === n.TextRenderingMode.FILL_STROKE) {
                              i.fill()
                          }
                          if (c === n.TextRenderingMode.STROKE || c === n.TextRenderingMode.FILL_STROKE) {
                              i.stroke()
                          }
                          i.restore()
                      } else {
                          if (c === n.TextRenderingMode.FILL || c === n.TextRenderingMode.FILL_STROKE) {
                              i.fillText(t, r, a)
                          }
                          if (c === n.TextRenderingMode.STROKE || c === n.TextRenderingMode.FILL_STROKE) {
                              i.strokeText(t, r, a)
                          }
                      }
                      if (f) {
                          var h = this.pendingTextPaths || (this.pendingTextPaths = []);
                          h.push({
                              transform: i.mozCurrentTransform,
                              x: r,
                              y: a,
                              fontSize: u,
                              addToPath: d
                          })
                      }
                  },
                  get isFontSubpixelAAEnabled() {
                      var e = this.canvasFactory.create(10, 10).context;
                      e.scale(1.5, 1);
                      e.fillText("I", 0, 10);
                      var t = e.getImageData(0, 0, 10, 10).data;
                      var r = false;
                      for (var a = 3; a < t.length; a += 4) {
                          if (t[a] > 0 && t[a] < 255) {
                              r = true;
                              break
                          }
                      }
                      return (0,
                      n.shadow)(this, "isFontSubpixelAAEnabled", r)
                  },
                  showText: function e(t) {
                      var r = this.current;
                      var a = r.font;
                      if (a.isType3Font) {
                          return this.showType3Text(t)
                      }
                      var i = r.fontSize;
                      if (i === 0) {
                          return
                      }
                      var s = this.ctx;
                      var o = r.fontSizeScale;
                      var l = r.charSpacing;
                      var c = r.wordSpacing;
                      var f = r.fontDirection;
                      var d = r.textHScale * f;
                      var h = t.length;
                      var p = a.vertical;
                      var v = p ? 1 : -1;
                      var m = a.defaultVMetrics;
                      var g = i * r.fontMatrix[0];
                      var b = r.textRenderingMode === n.TextRenderingMode.FILL && !a.disableFontFace;
                      s.save();
                      s.transform.apply(s, r.textMatrix);
                      s.translate(r.x, r.y + r.textRise);
                      if (r.patternFill) {
                          s.fillStyle = r.fillColor.getPattern(s, this)
                      }
                      if (f > 0) {
                          s.scale(d, -1)
                      } else {
                          s.scale(d, 1)
                      }
                      var _ = r.lineWidth;
                      var y = r.textMatrixScale;
                      if (y === 0 || _ === 0) {
                          var A = r.textRenderingMode & n.TextRenderingMode.FILL_STROKE_MASK;
                          if (A === n.TextRenderingMode.STROKE || A === n.TextRenderingMode.FILL_STROKE) {
                              this.cachedGetSinglePixelWidth = null;
                              _ = this.getSinglePixelWidth() * u
                          }
                      } else {
                          _ /= y
                      }
                      if (o !== 1) {
                          s.scale(o, o);
                          _ /= o
                      }
                      s.lineWidth = _;
                      var S = 0, w;
                      for (w = 0; w < h; ++w) {
                          var P = t[w];
                          if ((0,
                          n.isNum)(P)) {
                              S += v * P * i / 1e3;
                              continue
                          }
                          var C = false;
                          var k = (P.isSpace ? c : 0) + l;
                          var R = P.fontChar;
                          var x = P.accent;
                          var T, E, I, L;
                          var O = P.width;
                          if (p) {
                              var j, D, F;
                              j = P.vmetric || m;
                              D = P.vmetric ? j[1] : O * .5;
                              D = -D * g;
                              F = j[2] * g;
                              O = j ? -j[0] : O;
                              T = D / o;
                              E = (S + F) / o
                          } else {
                              T = S / o;
                              E = 0
                          }
                          if (a.remeasure && O > 0) {
                              var N = s.measureText(R).width * 1e3 / i * o;
                              if (O < N && this.isFontSubpixelAAEnabled) {
                                  var M = O / N;
                                  C = true;
                                  s.save();
                                  s.scale(M, 1);
                                  T /= M
                              } else if (O !== N) {
                                  T += (O - N) / 2e3 * i / o
                              }
                          }
                          if (P.isInFont || a.missingFile) {
                              if (b && !x) {
                                  s.fillText(R, T, E)
                              } else {
                                  this.paintChar(R, T, E);
                                  if (x) {
                                      I = T + x.offset.x / o;
                                      L = E - x.offset.y / o;
                                      this.paintChar(x.fontChar, I, L)
                                  }
                              }
                          }
                          var q = O * g + k * f;
                          S += q;
                          if (C) {
                              s.restore()
                          }
                      }
                      if (p) {
                          r.y -= S * d
                      } else {
                          r.x += S * d
                      }
                      s.restore()
                  },
                  showType3Text: function e(t) {
                      var r = this.ctx;
                      var a = this.current;
                      var i = a.font;
                      var s = a.fontSize;
                      var o = a.fontDirection;
                      var l = i.vertical ? 1 : -1;
                      var u = a.charSpacing;
                      var c = a.wordSpacing;
                      var f = a.textHScale * o;
                      var d = a.fontMatrix || n.FONT_IDENTITY_MATRIX;
                      var h = t.length;
                      var p = a.textRenderingMode === n.TextRenderingMode.INVISIBLE;
                      var v, m, g, b;
                      if (p || s === 0) {
                          return
                      }
                      this.cachedGetSinglePixelWidth = null;
                      r.save();
                      r.transform.apply(r, a.textMatrix);
                      r.translate(a.x, a.y);
                      r.scale(f, o);
                      for (v = 0; v < h; ++v) {
                          m = t[v];
                          if ((0,
                          n.isNum)(m)) {
                              b = l * m * s / 1e3;
                              this.ctx.translate(b, 0);
                              a.x += b * f;
                              continue
                          }
                          var _ = (m.isSpace ? c : 0) + u;
                          var y = i.charProcOperatorList[m.operatorListId];
                          if (!y) {
                              (0,
                              n.warn)('Type3 character "' + m.operatorListId + '" is not available.');
                              continue
                          }
                          this.processingType3 = m;
                          this.save();
                          r.scale(s, s);
                          r.transform.apply(r, d);
                          this.executeOperatorList(y);
                          this.restore();
                          var A = n.Util.applyTransform([m.width, 0], d);
                          g = A[0] * s + _;
                          r.translate(g, 0);
                          a.x += g * f
                      }
                      r.restore();
                      this.processingType3 = null
                  },
                  setCharWidth: function e(t, r) {},
                  setCharWidthAndBounds: function e(t, r, n, a, i, s) {
                      this.ctx.rect(n, a, i - n, s - a);
                      this.clip();
                      this.endPath()
                  },
                  getColorN_Pattern: function e(t) {
                      var r = this;
                      var n;
                      if (t[0] === "TilingPattern") {
                          var i = t[1];
                          var s = this.baseTransform || this.ctx.mozCurrentTransform.slice();
                          var o = {
                              createCanvasGraphics: function e(t) {
                                  return new b(t,r.commonObjs,r.objs,r.canvasFactory)
                              }
                          };
                          n = new a.TilingPattern(t,i,this.ctx,o,s)
                      } else {
                          n = (0,
                          a.getShadingPatternFromIR)(t)
                      }
                      return n
                  },
                  setStrokeColorN: function e() {
                      this.current.strokeColor = this.getColorN_Pattern(arguments)
                  },
                  setFillColorN: function e() {
                      this.current.fillColor = this.getColorN_Pattern(arguments);
                      this.current.patternFill = true
                  },
                  setStrokeRGBColor: function e(t, r, a) {
                      var i = n.Util.makeCssRgb(t, r, a);
                      this.ctx.strokeStyle = i;
                      this.current.strokeColor = i
                  },
                  setFillRGBColor: function e(t, r, a) {
                      var i = n.Util.makeCssRgb(t, r, a);
                      this.ctx.fillStyle = i;
                      this.current.fillColor = i;
                      this.current.patternFill = false
                  },
                  shadingFill: function e(t) {
                      var r = this.ctx;
                      this.save();
                      var i = (0,
                      a.getShadingPatternFromIR)(t);
                      r.fillStyle = i.getPattern(r, this, true);
                      var s = r.mozCurrentTransformInverse;
                      if (s) {
                          var o = r.canvas;
                          var l = o.width;
                          var u = o.height;
                          var c = n.Util.applyTransform([0, 0], s);
                          var f = n.Util.applyTransform([0, u], s);
                          var d = n.Util.applyTransform([l, 0], s);
                          var h = n.Util.applyTransform([l, u], s);
                          var p = Math.min(c[0], f[0], d[0], h[0]);
                          var v = Math.min(c[1], f[1], d[1], h[1]);
                          var m = Math.max(c[0], f[0], d[0], h[0]);
                          var g = Math.max(c[1], f[1], d[1], h[1]);
                          this.ctx.fillRect(p, v, m - p, g - v)
                      } else {
                          this.ctx.fillRect(-1e10, -1e10, 2e10, 2e10)
                      }
                      this.restore()
                  },
                  beginInlineImage: function e() {
                      throw new Error("Should not call beginInlineImage")
                  },
                  beginImageData: function e() {
                      throw new Error("Should not call beginImageData")
                  },
                  paintFormXObjectBegin: function e(t, r) {
                      this.save();
                      this.baseTransformStack.push(this.baseTransform);
                      if ((0,
                      n.isArray)(t) && t.length === 6) {
                          this.transform.apply(this, t)
                      }
                      this.baseTransform = this.ctx.mozCurrentTransform;
                      if ((0,
                      n.isArray)(r) && r.length === 4) {
                          var a = r[2] - r[0];
                          var i = r[3] - r[1];
                          this.ctx.rect(r[0], r[1], a, i);
                          this.clip();
                          this.endPath()
                      }
                  },
                  paintFormXObjectEnd: function e() {
                      this.restore();
                      this.baseTransform = this.baseTransformStack.pop()
                  },
                  beginGroup: function e(t) {
                      this.save();
                      var r = this.ctx;
                      if (!t.isolated) {
                          (0,
                          n.info)("TODO: Support non-isolated groups.")
                      }
                      if (t.knockout) {
                          (0,
                          n.warn)("Knockout groups not supported.")
                      }
                      var a = r.mozCurrentTransform;
                      if (t.matrix) {
                          r.transform.apply(r, t.matrix)
                      }
                      if (!t.bbox) {
                          throw new Error("Bounding box is required.")
                      }
                      var i = n.Util.getAxialAlignedBoundingBox(t.bbox, r.mozCurrentTransform);
                      var s = [0, 0, r.canvas.width, r.canvas.height];
                      i = n.Util.intersect(i, s) || [0, 0, 0, 0];
                      var o = Math.floor(i[0]);
                      var u = Math.floor(i[1]);
                      var c = Math.max(Math.ceil(i[2]) - o, 1);
                      var f = Math.max(Math.ceil(i[3]) - u, 1);
                      var d = 1
                        , h = 1;
                      if (c > l) {
                          d = c / l;
                          c = l
                      }
                      if (f > l) {
                          h = f / l;
                          f = l
                      }
                      var p = "groupAt" + this.groupLevel;
                      if (t.smask) {
                          p += "_smask_" + this.smaskCounter++ % 2
                      }
                      var v = this.cachedCanvases.getCanvas(p, c, f, true);
                      var m = v.context;
                      m.scale(1 / d, 1 / h);
                      m.translate(-o, -u);
                      m.transform.apply(m, a);
                      if (t.smask) {
                          this.smaskStack.push({
                              canvas: v.canvas,
                              context: m,
                              offsetX: o,
                              offsetY: u,
                              scaleX: d,
                              scaleY: h,
                              subtype: t.smask.subtype,
                              backdrop: t.smask.backdrop,
                              transferMap: t.smask.transferMap || null,
                              startTransformInverse: null
                          })
                      } else {
                          r.setTransform(1, 0, 0, 1, 0, 0);
                          r.translate(o, u);
                          r.scale(d, h)
                      }
                      A(r, m);
                      this.ctx = m;
                      this.setGState([["BM", "source-over"], ["ca", 1], ["CA", 1]]);
                      this.groupStack.push(r);
                      this.groupLevel++;
                      this.current.activeSMask = null
                  },
                  endGroup: function e(t) {
                      this.groupLevel--;
                      var r = this.ctx;
                      this.ctx = this.groupStack.pop();
                      if (this.ctx.imageSmoothingEnabled !== undefined) {
                          this.ctx.imageSmoothingEnabled = false
                      } else {
                          this.ctx.mozImageSmoothingEnabled = false
                      }
                      if (t.smask) {
                          this.tempSMask = this.smaskStack.pop()
                      } else {
                          this.ctx.drawImage(r.canvas, 0, 0)
                      }
                      this.restore()
                  },
                  beginAnnotations: function e() {
                      this.save();
                      if (this.baseTransform) {
                          this.ctx.setTransform.apply(this.ctx, this.baseTransform)
                      }
                  },
                  endAnnotations: function e() {
                      this.restore()
                  },
                  beginAnnotation: function e(t, r, a) {
                      this.save();
                      S(this.ctx);
                      this.current = new g;
                      if ((0,
                      n.isArray)(t) && t.length === 4) {
                          var i = t[2] - t[0];
                          var s = t[3] - t[1];
                          this.ctx.rect(t[0], t[1], i, s);
                          this.clip();
                          this.endPath()
                      }
                      this.transform.apply(this, r);
                      this.transform.apply(this, a)
                  },
                  endAnnotation: function e() {
                      this.restore()
                  },
                  paintJpegXObject: function e(t, r, a) {
                      var i = this.objs.get(t);
                      if (!i) {
                          (0,
                          n.warn)("Dependent image isn't ready yet");
                          return
                      }
                      this.save();
                      var s = this.ctx;
                      s.scale(1 / r, -1 / a);
                      s.drawImage(i, 0, 0, i.width, i.height, 0, -a, r, a);
                      if (this.imageLayer) {
                          var o = s.mozCurrentTransformInverse;
                          var l = this.getCanvasPosition(0, 0);
                          this.imageLayer.appendImage({
                              objId: t,
                              left: l[0],
                              top: l[1],
                              width: r / o[0],
                              height: a / o[3]
                          })
                      }
                      this.restore()
                  },
                  paintImageMaskXObject: function e(t) {
                      var r = this.ctx;
                      var n = t.width
                        , a = t.height;
                      var i = this.current.fillColor;
                      var s = this.current.patternFill;
                      var o = this.processingType3;
                      if (c && o && o.compiled === undefined) {
                          if (n <= f && a <= f) {
                              o.compiled = m({
                                  data: t.data,
                                  width: n,
                                  height: a
                              })
                          } else {
                              o.compiled = null
                          }
                      }
                      if (o && o.compiled) {
                          o.compiled(r);
                          return
                      }
                      var l = this.cachedCanvases.getCanvas("maskCanvas", n, a);
                      var u = l.context;
                      u.save();
                      y(u, t);
                      u.globalCompositeOperation = "source-in";
                      u.fillStyle = s ? i.getPattern(u, this) : i;
                      u.fillRect(0, 0, n, a);
                      u.restore();
                      this.paintInlineImageXObject(l.canvas)
                  },
                  paintImageMaskXObjectRepeat: function e(t, r, n, a) {
                      var i = t.width;
                      var s = t.height;
                      var o = this.current.fillColor;
                      var l = this.current.patternFill;
                      var u = this.cachedCanvases.getCanvas("maskCanvas", i, s);
                      var c = u.context;
                      c.save();
                      y(c, t);
                      c.globalCompositeOperation = "source-in";
                      c.fillStyle = l ? o.getPattern(c, this) : o;
                      c.fillRect(0, 0, i, s);
                      c.restore();
                      var f = this.ctx;
                      for (var d = 0, h = a.length; d < h; d += 2) {
                          f.save();
                          f.transform(r, 0, 0, n, a[d], a[d + 1]);
                          f.scale(1, -1);
                          f.drawImage(u.canvas, 0, 0, i, s, 0, -1, 1, 1);
                          f.restore()
                      }
                  },
                  paintImageMaskXObjectGroup: function e(t) {
                      var r = this.ctx;
                      var n = this.current.fillColor;
                      var a = this.current.patternFill;
                      for (var i = 0, s = t.length; i < s; i++) {
                          var o = t[i];
                          var l = o.width
                            , u = o.height;
                          var c = this.cachedCanvases.getCanvas("maskCanvas", l, u);
                          var f = c.context;
                          f.save();
                          y(f, o);
                          f.globalCompositeOperation = "source-in";
                          f.fillStyle = a ? n.getPattern(f, this) : n;
                          f.fillRect(0, 0, l, u);
                          f.restore();
                          r.save();
                          r.transform.apply(r, o.transform);
                          r.scale(1, -1);
                          r.drawImage(c.canvas, 0, 0, l, u, 0, -1, 1, 1);
                          r.restore()
                      }
                  },
                  paintImageXObject: function e(t) {
                      var r = this.objs.get(t);
                      if (!r) {
                          (0,
                          n.warn)("Dependent image isn't ready yet");
                          return
                      }
                      this.paintInlineImageXObject(r)
                  },
                  paintImageXObjectRepeat: function e(t, r, a, i) {
                      var s = this.objs.get(t);
                      if (!s) {
                          (0,
                          n.warn)("Dependent image isn't ready yet");
                          return
                      }
                      var o = s.width;
                      var l = s.height;
                      var u = [];
                      for (var c = 0, f = i.length; c < f; c += 2) {
                          u.push({
                              transform: [r, 0, 0, a, i[c], i[c + 1]],
                              x: 0,
                              y: 0,
                              w: o,
                              h: l
                          })
                      }
                      this.paintInlineImageXObjectGroup(s, u)
                  },
                  paintInlineImageXObject: function e(t) {
                      var r = t.width;
                      var n = t.height;
                      var a = this.ctx;
                      this.save();
                      a.scale(1 / r, -1 / n);
                      var i = a.mozCurrentTransformInverse;
                      var s = i[0]
                        , o = i[1];
                      var l = Math.max(Math.sqrt(s * s + o * o), 1);
                      var u = i[2]
                        , c = i[3];
                      var f = Math.max(Math.sqrt(u * u + c * c), 1);
                      var d, h;
                      if (t instanceof HTMLElement || !t.data) {
                          d = t
                      } else {
                          h = this.cachedCanvases.getCanvas("inlineImage", r, n);
                          var p = h.context;
                          _(p, t);
                          d = h.canvas
                      }
                      var v = r
                        , m = n;
                      var g = "prescale1";
                      while (l > 2 && v > 1 || f > 2 && m > 1) {
                          var b = v
                            , y = m;
                          if (l > 2 && v > 1) {
                              b = Math.ceil(v / 2);
                              l /= v / b
                          }
                          if (f > 2 && m > 1) {
                              y = Math.ceil(m / 2);
                              f /= m / y
                          }
                          h = this.cachedCanvases.getCanvas(g, b, y);
                          p = h.context;
                          p.clearRect(0, 0, b, y);
                          p.drawImage(d, 0, 0, v, m, 0, 0, b, y);
                          d = h.canvas;
                          v = b;
                          m = y;
                          g = g === "prescale1" ? "prescale2" : "prescale1"
                      }
                      a.drawImage(d, 0, 0, v, m, 0, -n, r, n);
                      if (this.imageLayer) {
                          var A = this.getCanvasPosition(0, -n);
                          this.imageLayer.appendImage({
                              imgData: t,
                              left: A[0],
                              top: A[1],
                              width: r / i[0],
                              height: n / i[3]
                          })
                      }
                      this.restore()
                  },
                  paintInlineImageXObjectGroup: function e(t, r) {
                      var n = this.ctx;
                      var a = t.width;
                      var i = t.height;
                      var s = this.cachedCanvases.getCanvas("inlineImage", a, i);
                      var o = s.context;
                      _(o, t);
                      for (var l = 0, u = r.length; l < u; l++) {
                          var c = r[l];
                          n.save();
                          n.transform.apply(n, c.transform);
                          n.scale(1, -1);
                          n.drawImage(s.canvas, c.x, c.y, c.w, c.h, 0, -1, 1, 1);
                          if (this.imageLayer) {
                              var f = this.getCanvasPosition(c.x, c.y);
                              this.imageLayer.appendImage({
                                  imgData: t,
                                  left: f[0],
                                  top: f[1],
                                  width: a,
                                  height: i
                              })
                          }
                          n.restore()
                      }
                  },
                  paintSolidColorImageMask: function e() {
                      this.ctx.fillRect(0, 0, 1, 1)
                  },
                  paintXObject: function e() {
                      (0,
                      n.warn)("Unsupported 'paintXObject' command.")
                  },
                  markPoint: function e(t) {},
                  markPointProps: function e(t, r) {},
                  beginMarkedContent: function e(t) {},
                  beginMarkedContentProps: function e(t, r) {},
                  endMarkedContent: function e() {},
                  beginCompat: function e() {},
                  endCompat: function e() {},
                  consumePath: function e() {
                      var t = this.ctx;
                      if (this.pendingClip) {
                          if (this.pendingClip === I) {
                              t.clip("evenodd")
                          } else {
                              t.clip()
                          }
                          this.pendingClip = null
                      }
                      t.beginPath()
                  },
                  getSinglePixelWidth: function e(t) {
                      if (this.cachedGetSinglePixelWidth === null) {
                          this.ctx.save();
                          var r = this.ctx.mozCurrentTransformInverse;
                          this.ctx.restore();
                          this.cachedGetSinglePixelWidth = Math.sqrt(Math.max(r[0] * r[0] + r[1] * r[1], r[2] * r[2] + r[3] * r[3]))
                      }
                      return this.cachedGetSinglePixelWidth
                  },
                  getCanvasPosition: function e(t, r) {
                      var n = this.ctx.mozCurrentTransform;
                      return [n[0] * t + n[2] * r + n[4], n[1] * t + n[3] * r + n[5]]
                  }
              };
              for (var L in n.OPS) {
                  b.prototype[n.OPS[L]] = b.prototype[L]
              }
              return b
          }();
          t.CanvasGraphics = b
      }
      , function(e, t, r) {
          "use strict";
          Object.defineProperty(t, "__esModule", {
              value: true
          });
          t.FontLoader = t.FontFaceObject = undefined;
          var n = r(0);
          function a(e) {
              this.docId = e;
              this.styleElement = null;
              this.nativeFontFaces = [];
              this.loadTestFontId = 0;
              this.loadingContext = {
                  requests: [],
                  nextRequestId: 0
              }
          }
          a.prototype = {
              insertRule: function e(t) {
                  var r = this.styleElement;
                  if (!r) {
                      r = this.styleElement = document.createElement("style");
                      r.id = "PDFJS_FONT_STYLE_TAG_" + this.docId;
                      document.documentElement.getElementsByTagName("head")[0].appendChild(r)
                  }
                  var n = r.sheet;
                  n.insertRule(t, n.cssRules.length)
              },
              clear: function e() {
                  if (this.styleElement) {
                      this.styleElement.remove();
                      this.styleElement = null
                  }
                  this.nativeFontFaces.forEach(function(e) {
                      document.fonts.delete(e)
                  });
                  this.nativeFontFaces.length = 0
              }
          };
          {
              var i = function e() {
                  return atob("T1RUTwALAIAAAwAwQ0ZGIDHtZg4AAAOYAAAAgUZGVE1lkzZwAAAEHAAAABxHREVGABQAFQ" + "AABDgAAAAeT1MvMlYNYwkAAAEgAAAAYGNtYXABDQLUAAACNAAAAUJoZWFk/xVFDQAAALwA" + "AAA2aGhlYQdkA+oAAAD0AAAAJGhtdHgD6AAAAAAEWAAAAAZtYXhwAAJQAAAAARgAAAAGbm" + "FtZVjmdH4AAAGAAAAAsXBvc3T/hgAzAAADeAAAACAAAQAAAAEAALZRFsRfDzz1AAsD6AAA" + "AADOBOTLAAAAAM4KHDwAAAAAA+gDIQAAAAgAAgAAAAAAAAABAAADIQAAAFoD6AAAAAAD6A" + "ABAAAAAAAAAAAAAAAAAAAAAQAAUAAAAgAAAAQD6AH0AAUAAAKKArwAAACMAooCvAAAAeAA" + "MQECAAACAAYJAAAAAAAAAAAAAQAAAAAAAAAAAAAAAFBmRWQAwAAuAC4DIP84AFoDIQAAAA" + "AAAQAAAAAAAAAAACAAIAABAAAADgCuAAEAAAAAAAAAAQAAAAEAAAAAAAEAAQAAAAEAAAAA" + "AAIAAQAAAAEAAAAAAAMAAQAAAAEAAAAAAAQAAQAAAAEAAAAAAAUAAQAAAAEAAAAAAAYAAQ" + "AAAAMAAQQJAAAAAgABAAMAAQQJAAEAAgABAAMAAQQJAAIAAgABAAMAAQQJAAMAAgABAAMA" + "AQQJAAQAAgABAAMAAQQJAAUAAgABAAMAAQQJAAYAAgABWABYAAAAAAAAAwAAAAMAAAAcAA" + "EAAAAAADwAAwABAAAAHAAEACAAAAAEAAQAAQAAAC7//wAAAC7////TAAEAAAAAAAABBgAA" + "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAA" + "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" + "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" + "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" + "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAA" + "AAAAD/gwAyAAAAAQAAAAAAAAAAAAAAAAAAAAABAAQEAAEBAQJYAAEBASH4DwD4GwHEAvgc" + "A/gXBIwMAYuL+nz5tQXkD5j3CBLnEQACAQEBIVhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWF" + "hYWFhYWFhYAAABAQAADwACAQEEE/t3Dov6fAH6fAT+fPp8+nwHDosMCvm1Cvm1DAz6fBQA" + "AAAAAAABAAAAAMmJbzEAAAAAzgTjFQAAAADOBOQpAAEAAAAAAAAADAAUAAQAAAABAAAAAg" + "ABAAAAAAAAAAAD6AAAAAAAAA==")
              };
              Object.defineProperty(a.prototype, "loadTestFont", {
                  get: function e() {
                      return (0,
                      n.shadow)(this, "loadTestFont", i())
                  },
                  configurable: true
              });
              a.prototype.addNativeFontFace = function e(t) {
                  this.nativeFontFaces.push(t);
                  document.fonts.add(t)
              }
              ;
              a.prototype.bind = function e(t, r) {
                  var i = [];
                  var s = [];
                  var o = [];
                  var l = function e(t) {
                      return t.loaded.catch(function(e) {
                          (0,
                          n.warn)('Failed to load font "' + t.family + '": ' + e)
                      })
                  };
                  var u = a.isFontLoadingAPISupported && !a.isSyncFontLoadingSupported;
                  for (var c = 0, f = t.length; c < f; c++) {
                      var d = t[c];
                      if (d.attached || d.loading === false) {
                          continue
                      }
                      d.attached = true;
                      if (u) {
                          var h = d.createNativeFontFace();
                          if (h) {
                              this.addNativeFontFace(h);
                              o.push(l(h))
                          }
                      } else {
                          var p = d.createFontFaceRule();
                          if (p) {
                              this.insertRule(p);
                              i.push(p);
                              s.push(d)
                          }
                      }
                  }
                  var v = this.queueLoadingCallback(r);
                  if (u) {
                      Promise.all(o).then(function() {
                          v.complete()
                      })
                  } else if (i.length > 0 && !a.isSyncFontLoadingSupported) {
                      this.prepareFontLoadEvent(i, s, v)
                  } else {
                      v.complete()
                  }
              }
              ;
              a.prototype.queueLoadingCallback = function e(t) {
                  function r() {
                      (0,
                      n.assert)(!s.end, "completeRequest() cannot be called twice");
                      s.end = Date.now();
                      while (a.requests.length > 0 && a.requests[0].end) {
                          var e = a.requests.shift();
                          setTimeout(e.callback, 0)
                      }
                  }
                  var a = this.loadingContext;
                  var i = "pdfjs-font-loading-" + a.nextRequestId++;
                  var s = {
                      id: i,
                      complete: r,
                      callback: t,
                      started: Date.now()
                  };
                  a.requests.push(s);
                  return s
              }
              ;
              a.prototype.prepareFontLoadEvent = function e(t, r, a) {
                  function i(e, t) {
                      return e.charCodeAt(t) << 24 | e.charCodeAt(t + 1) << 16 | e.charCodeAt(t + 2) << 8 | e.charCodeAt(t + 3) & 255
                  }
                  function s(e, t, r, n) {
                      var a = e.substr(0, t);
                      var i = e.substr(t + r);
                      return a + n + i
                  }
                  var o, l;
                  var u = document.createElement("canvas");
                  u.width = 1;
                  u.height = 1;
                  var c = u.getContext("2d");
                  var f = 0;
                  function d(e, t) {
                      f++;
                      if (f > 30) {
                          (0,
                          n.warn)("Load test font never loaded.");
                          t();
                          return
                      }
                      c.font = "30px " + e;
                      c.fillText(".", 0, 20);
                      var r = c.getImageData(0, 0, 1, 1);
                      if (r.data[3] > 0) {
                          t();
                          return
                      }
                      setTimeout(d.bind(null, e, t))
                  }
                  var h = "lt" + Date.now() + this.loadTestFontId++;
                  var p = this.loadTestFont;
                  var v = 976;
                  p = s(p, v, h.length, h);
                  var m = 16;
                  var g = 1482184792;
                  var b = i(p, m);
                  for (o = 0,
                  l = h.length - 3; o < l; o += 4) {
                      b = b - g + i(h, o) | 0
                  }
                  if (o < h.length) {
                      b = b - g + i(h + "XXX", o) | 0
                  }
                  p = s(p, m, 4, (0,
                  n.string32)(b));
                  var _ = "url(data:font/opentype;base64," + btoa(p) + ");";
                  var y = '@font-face { font-family:"' + h + '";src:' + _ + "}";
                  this.insertRule(y);
                  var A = [];
                  for (o = 0,
                  l = r.length; o < l; o++) {
                      A.push(r[o].loadedName)
                  }
                  A.push(h);
                  var S = document.createElement("div");
                  S.setAttribute("style", "visibility: hidden;" + "width: 10px; height: 10px;" + "position: absolute; top: 0px; left: 0px;");
                  for (o = 0,
                  l = A.length; o < l; ++o) {
                      var w = document.createElement("span");
                      w.textContent = "Hi";
                      w.style.fontFamily = A[o];
                      S.appendChild(w)
                  }
                  document.body.appendChild(S);
                  d(h, function() {
                      document.body.removeChild(S);
                      a.complete()
                  })
              }
          }
          {
              a.isFontLoadingAPISupported = typeof document !== "undefined" && !!document.fonts
          }
          {
              var s = function e() {
                  if (typeof navigator === "undefined") {
                      return true
                  }
                  var t = false;
                  var r = /Mozilla\/5.0.*?rv:(\d+).*? Gecko/.exec(navigator.userAgent);
                  if (r && r[1] >= 14) {
                      t = true
                  }
                  return t
              };
              Object.defineProperty(a, "isSyncFontLoadingSupported", {
                  get: function e() {
                      return (0,
                      n.shadow)(a, "isSyncFontLoadingSupported", s())
                  },
                  enumerable: true,
                  configurable: true
              })
          }
          var o = {
              get value() {
                  return (0,
                  n.shadow)(this, "value", (0,
                  n.isEvalSupported)())
              }
          };
          var l = function e() {
              function t(e, t) {
                  this.compiledGlyphs = Object.create(null);
                  for (var r in e) {
                      this[r] = e[r]
                  }
                  this.options = t
              }
              t.prototype = {
                  createNativeFontFace: function e() {
                      if (!this.data) {
                          return null
                      }
                      if (this.options.disableFontFace) {
                          this.disableFontFace = true;
                          return null
                      }
                      var t = new FontFace(this.loadedName,this.data,{});
                      if (this.options.fontRegistry) {
                          this.options.fontRegistry.registerFont(this)
                      }
                      return t
                  },
                  createFontFaceRule: function e() {
                      if (!this.data) {
                          return null
                      }
                      if (this.options.disableFontFace) {
                          this.disableFontFace = true;
                          return null
                      }
                      var t = (0,
                      n.bytesToString)(new Uint8Array(this.data));
                      var r = this.loadedName;
                      var a = "url(data:" + this.mimetype + ";base64," + btoa(t) + ");";
                      var i = '@font-face { font-family:"' + r + '";src:' + a + "}";
                      if (this.options.fontRegistry) {
                          this.options.fontRegistry.registerFont(this, a)
                      }
                      return i
                  },
                  getPathGenerator: function e(t, r) {
                      if (!(r in this.compiledGlyphs)) {
                          var n = t.get(this.loadedName + "_path_" + r);
                          var a, i, s;
                          if (this.options.isEvalSupported && o.value) {
                              var l, u = "";
                              for (i = 0,
                              s = n.length; i < s; i++) {
                                  a = n[i];
                                  if (a.args !== undefined) {
                                      l = a.args.join(",")
                                  } else {
                                      l = ""
                                  }
                                  u += "c." + a.cmd + "(" + l + ");\n"
                              }
                              this.compiledGlyphs[r] = new Function("c","size",u)
                          } else {
                              this.compiledGlyphs[r] = function(e, t) {
                                  for (i = 0,
                                  s = n.length; i < s; i++) {
                                      a = n[i];
                                      if (a.cmd === "scale") {
                                          a.args = [t, -t]
                                      }
                                      e[a.cmd].apply(e, a.args)
                                  }
                              }
                          }
                      }
                      return this.compiledGlyphs[r]
                  }
              };
              return t
          }();
          t.FontFaceObject = l;
          t.FontLoader = a
      }
      , function(e, t, r) {
          "use strict";
          Object.defineProperty(t, "__esModule", {
              value: true
          });
          t.TilingPattern = t.getShadingPatternFromIR = undefined;
          var n = r(0);
          var a = r(7);
          var i = {};
          i.RadialAxial = {
              fromIR: function e(t) {
                  var r = t[1];
                  var n = t[2];
                  var a = t[3];
                  var i = t[4];
                  var s = t[5];
                  var o = t[6];
                  return {
                      type: "Pattern",
                      getPattern: function e(t) {
                          var l;
                          if (r === "axial") {
                              l = t.createLinearGradient(a[0], a[1], i[0], i[1])
                          } else if (r === "radial") {
                              l = t.createRadialGradient(a[0], a[1], s, i[0], i[1], o)
                          }
                          for (var u = 0, c = n.length; u < c; ++u) {
                              var f = n[u];
                              l.addColorStop(f[0], f[1])
                          }
                          return l
                      }
                  }
              }
          };
          var s = function e() {
              function t(e, t, r, n, a, i, s, o) {
                  var l = t.coords
                    , u = t.colors;
                  var c = e.data
                    , f = e.width * 4;
                  var d;
                  if (l[r + 1] > l[n + 1]) {
                      d = r;
                      r = n;
                      n = d;
                      d = i;
                      i = s;
                      s = d
                  }
                  if (l[n + 1] > l[a + 1]) {
                      d = n;
                      n = a;
                      a = d;
                      d = s;
                      s = o;
                      o = d
                  }
                  if (l[r + 1] > l[n + 1]) {
                      d = r;
                      r = n;
                      n = d;
                      d = i;
                      i = s;
                      s = d
                  }
                  var h = (l[r] + t.offsetX) * t.scaleX;
                  var p = (l[r + 1] + t.offsetY) * t.scaleY;
                  var v = (l[n] + t.offsetX) * t.scaleX;
                  var m = (l[n + 1] + t.offsetY) * t.scaleY;
                  var g = (l[a] + t.offsetX) * t.scaleX;
                  var b = (l[a + 1] + t.offsetY) * t.scaleY;
                  if (p >= b) {
                      return
                  }
                  var _ = u[i]
                    , y = u[i + 1]
                    , A = u[i + 2];
                  var S = u[s]
                    , w = u[s + 1]
                    , P = u[s + 2];
                  var C = u[o]
                    , k = u[o + 1]
                    , R = u[o + 2];
                  var x = Math.round(p)
                    , T = Math.round(b);
                  var E, I, L, O;
                  var j, D, F, N;
                  var M;
                  for (var q = x; q <= T; q++) {
                      if (q < m) {
                          M = q < p ? 0 : p === m ? 1 : (p - q) / (p - m);
                          E = h - (h - v) * M;
                          I = _ - (_ - S) * M;
                          L = y - (y - w) * M;
                          O = A - (A - P) * M
                      } else {
                          M = q > b ? 1 : m === b ? 0 : (m - q) / (m - b);
                          E = v - (v - g) * M;
                          I = S - (S - C) * M;
                          L = w - (w - k) * M;
                          O = P - (P - R) * M
                      }
                      M = q < p ? 0 : q > b ? 1 : (p - q) / (p - b);
                      j = h - (h - g) * M;
                      D = _ - (_ - C) * M;
                      F = y - (y - k) * M;
                      N = A - (A - R) * M;
                      var U = Math.round(Math.min(E, j));
                      var W = Math.round(Math.max(E, j));
                      var B = f * q + U * 4;
                      for (var z = U; z <= W; z++) {
                          M = (E - z) / (E - j);
                          M = M < 0 ? 0 : M > 1 ? 1 : M;
                          c[B++] = I - (I - D) * M | 0;
                          c[B++] = L - (L - F) * M | 0;
                          c[B++] = O - (O - N) * M | 0;
                          c[B++] = 255
                      }
                  }
              }
              function r(e, r, n) {
                  var a = r.coords;
                  var i = r.colors;
                  var s, o;
                  switch (r.type) {
                  case "lattice":
                      var l = r.verticesPerRow;
                      var u = Math.floor(a.length / l) - 1;
                      var c = l - 1;
                      for (s = 0; s < u; s++) {
                          var f = s * l;
                          for (var d = 0; d < c; d++,
                          f++) {
                              t(e, n, a[f], a[f + 1], a[f + l], i[f], i[f + 1], i[f + l]);
                              t(e, n, a[f + l + 1], a[f + 1], a[f + l], i[f + l + 1], i[f + 1], i[f + l])
                          }
                      }
                      break;
                  case "triangles":
                      for (s = 0,
                      o = a.length; s < o; s += 3) {
                          t(e, n, a[s], a[s + 1], a[s + 2], i[s], i[s + 1], i[s + 2])
                      }
                      break;
                  default:
                      throw new Error("illegal figure")
                  }
              }
              function n(e, t, n, i, s, o, l) {
                  var u = 1.1;
                  var c = 3e3;
                  var f = 2;
                  var d = Math.floor(e[0]);
                  var h = Math.floor(e[1]);
                  var p = Math.ceil(e[2]) - d;
                  var v = Math.ceil(e[3]) - h;
                  var m = Math.min(Math.ceil(Math.abs(p * t[0] * u)), c);
                  var g = Math.min(Math.ceil(Math.abs(v * t[1] * u)), c);
                  var b = p / m;
                  var _ = v / g;
                  var y = {
                      coords: n,
                      colors: i,
                      offsetX: -d,
                      offsetY: -h,
                      scaleX: 1 / b,
                      scaleY: 1 / _
                  };
                  var A = m + f * 2;
                  var S = g + f * 2;
                  var w, P, C, k;
                  if (a.WebGLUtils.isEnabled) {
                      w = a.WebGLUtils.drawFigures(m, g, o, s, y);
                      P = l.getCanvas("mesh", A, S, false);
                      P.context.drawImage(w, f, f);
                      w = P.canvas
                  } else {
                      P = l.getCanvas("mesh", A, S, false);
                      var R = P.context;
                      var x = R.createImageData(m, g);
                      if (o) {
                          var T = x.data;
                          for (C = 0,
                          k = T.length; C < k; C += 4) {
                              T[C] = o[0];
                              T[C + 1] = o[1];
                              T[C + 2] = o[2];
                              T[C + 3] = 255
                          }
                      }
                      for (C = 0; C < s.length; C++) {
                          r(x, s[C], y)
                      }
                      R.putImageData(x, f, f);
                      w = P.canvas
                  }
                  return {
                      canvas: w,
                      offsetX: d - f * b,
                      offsetY: h - f * _,
                      scaleX: b,
                      scaleY: _
                  }
              }
              return n
          }();
          i.Mesh = {
              fromIR: function e(t) {
                  var r = t[2];
                  var a = t[3];
                  var i = t[4];
                  var o = t[5];
                  var l = t[6];
                  var u = t[8];
                  return {
                      type: "Pattern",
                      getPattern: function e(t, c, f) {
                          var d;
                          if (f) {
                              d = n.Util.singularValueDecompose2dScale(t.mozCurrentTransform)
                          } else {
                              d = n.Util.singularValueDecompose2dScale(c.baseTransform);
                              if (l) {
                                  var h = n.Util.singularValueDecompose2dScale(l);
                                  d = [d[0] * h[0], d[1] * h[1]]
                              }
                          }
                          var p = s(o, d, r, a, i, f ? null : u, c.cachedCanvases);
                          if (!f) {
                              t.setTransform.apply(t, c.baseTransform);
                              if (l) {
                                  t.transform.apply(t, l)
                              }
                          }
                          t.translate(p.offsetX, p.offsetY);
                          t.scale(p.scaleX, p.scaleY);
                          return t.createPattern(p.canvas, "no-repeat")
                      }
                  }
              }
          };
          i.Dummy = {
              fromIR: function e() {
                  return {
                      type: "Pattern",
                      getPattern: function e() {
                          return "hotpink"
                      }
                  }
              }
          };
          function o(e) {
              var t = i[e[0]];
              if (!t) {
                  throw new Error("Unknown IR type: " + e[0])
              }
              return t.fromIR(e)
          }
          var l = function e() {
              var t = {
                  COLORED: 1,
                  UNCOLORED: 2
              };
              var r = 3e3;
              function a(e, t, r, n, a) {
                  this.operatorList = e[2];
                  this.matrix = e[3] || [1, 0, 0, 1, 0, 0];
                  this.bbox = e[4];
                  this.xstep = e[5];
                  this.ystep = e[6];
                  this.paintType = e[7];
                  this.tilingType = e[8];
                  this.color = t;
                  this.canvasGraphicsFactory = n;
                  this.baseTransform = a;
                  this.type = "Pattern";
                  this.ctx = r
              }
              a.prototype = {
                  createPatternCanvas: function e(t) {
                      var a = this.operatorList;
                      var i = this.bbox;
                      var s = this.xstep;
                      var o = this.ystep;
                      var l = this.paintType;
                      var u = this.tilingType;
                      var c = this.color;
                      var f = this.canvasGraphicsFactory;
                      (0,
                      n.info)("TilingType: " + u);
                      var d = i[0]
                        , h = i[1]
                        , p = i[2]
                        , v = i[3];
                      var m = [d, h];
                      var g = [d + s, h + o];
                      var b = g[0] - m[0];
                      var _ = g[1] - m[1];
                      var y = n.Util.singularValueDecompose2dScale(this.matrix);
                      var A = n.Util.singularValueDecompose2dScale(this.baseTransform);
                      var S = [y[0] * A[0], y[1] * A[1]];
                      b = Math.min(Math.ceil(Math.abs(b * S[0])), r);
                      _ = Math.min(Math.ceil(Math.abs(_ * S[1])), r);
                      var w = t.cachedCanvases.getCanvas("pattern", b, _, true);
                      var P = w.context;
                      var C = f.createCanvasGraphics(P);
                      C.groupLevel = t.groupLevel;
                      this.setFillAndStrokeStyleToContext(P, l, c);
                      this.setScale(b, _, s, o);
                      this.transformToScale(C);
                      var k = [1, 0, 0, 1, -m[0], -m[1]];
                      C.transform.apply(C, k);
                      this.clipBbox(C, i, d, h, p, v);
                      C.executeOperatorList(a);
                      return w.canvas
                  },
                  setScale: function e(t, r, n, a) {
                      this.scale = [t / n, r / a]
                  },
                  transformToScale: function e(t) {
                      var r = this.scale;
                      var n = [r[0], 0, 0, r[1], 0, 0];
                      t.transform.apply(t, n)
                  },
                  scaleToContext: function e() {
                      var t = this.scale;
                      this.ctx.scale(1 / t[0], 1 / t[1])
                  },
                  clipBbox: function e(t, r, a, i, s, o) {
                      if ((0,
                      n.isArray)(r) && r.length === 4) {
                          var l = s - a;
                          var u = o - i;
                          t.ctx.rect(a, i, l, u);
                          t.clip();
                          t.endPath()
                      }
                  },
                  setFillAndStrokeStyleToContext: function e(r, a, i) {
                      switch (a) {
                      case t.COLORED:
                          var s = this.ctx;
                          r.fillStyle = s.fillStyle;
                          r.strokeStyle = s.strokeStyle;
                          break;
                      case t.UNCOLORED:
                          var o = n.Util.makeCssRgb(i[0], i[1], i[2]);
                          r.fillStyle = o;
                          r.strokeStyle = o;
                          break;
                      default:
                          throw new n.FormatError("Unsupported paint type: " + a)
                      }
                  },
                  getPattern: function e(t, r) {
                      var n = this.createPatternCanvas(r);
                      t = this.ctx;
                      t.setTransform.apply(t, this.baseTransform);
                      t.transform.apply(t, this.matrix);
                      this.scaleToContext();
                      return t.createPattern(n, "repeat")
                  }
              };
              return a
          }();
          t.getShadingPatternFromIR = o;
          t.TilingPattern = l
      }
      , function(e, t, r) {
          "use strict";
          Object.defineProperty(t, "__esModule", {
              value: true
          });
          t.PDFDataTransportStream = undefined;
          var n = r(0);
          var a = function e() {
              function t(e, t) {
                  var r = this;
                  (0,
                  n.assert)(t);
                  this._queuedChunks = [];
                  var a = e.initialData;
                  if (a && a.length > 0) {
                      var i = new Uint8Array(a).buffer;
                      this._queuedChunks.push(i)
                  }
                  this._pdfDataRangeTransport = t;
                  this._isRangeSupported = !e.disableRange;
                  this._isStreamingSupported = !e.disableStream;
                  this._contentLength = e.length;
                  this._fullRequestReader = null;
                  this._rangeReaders = [];
                  this._pdfDataRangeTransport.addRangeListener(function(e, t) {
                      r._onReceiveData({
                          begin: e,
                          chunk: t
                      })
                  });
                  this._pdfDataRangeTransport.addProgressListener(function(e) {
                      r._onProgress({
                          loaded: e
                      })
                  });
                  this._pdfDataRangeTransport.addProgressiveReadListener(function(e) {
                      r._onReceiveData({
                          chunk: e
                      })
                  });
                  this._pdfDataRangeTransport.transportReady()
              }
              t.prototype = {
                  _onReceiveData: function e(t) {
                      var r = new Uint8Array(t.chunk).buffer;
                      if (t.begin === undefined) {
                          if (this._fullRequestReader) {
                              this._fullRequestReader._enqueue(r)
                          } else {
                              this._queuedChunks.push(r)
                          }
                      } else {
                          var a = this._rangeReaders.some(function(e) {
                              if (e._begin !== t.begin) {
                                  return false
                              }
                              e._enqueue(r);
                              return true
                          });
                          (0,
                          n.assert)(a)
                      }
                  },
                  _onProgress: function e(t) {
                      if (this._rangeReaders.length > 0) {
                          var r = this._rangeReaders[0];
                          if (r.onProgress) {
                              r.onProgress({
                                  loaded: t.loaded
                              })
                          }
                      }
                  },
                  _removeRangeReader: function e(t) {
                      var r = this._rangeReaders.indexOf(t);
                      if (r >= 0) {
                          this._rangeReaders.splice(r, 1)
                      }
                  },
                  getFullReader: function e() {
                      (0,
                      n.assert)(!this._fullRequestReader);
                      var t = this._queuedChunks;
                      this._queuedChunks = null;
                      return new r(this,t)
                  },
                  getRangeReader: function e(t, r) {
                      var n = new a(this,t,r);
                      this._pdfDataRangeTransport.requestDataRange(t, r);
                      this._rangeReaders.push(n);
                      return n
                  },
                  cancelAllRequests: function e(t) {
                      if (this._fullRequestReader) {
                          this._fullRequestReader.cancel(t)
                      }
                      var r = this._rangeReaders.slice(0);
                      r.forEach(function(e) {
                          e.cancel(t)
                      });
                      this._pdfDataRangeTransport.abort()
                  }
              };
              function r(e, t) {
                  this._stream = e;
                  this._done = false;
                  this._queuedChunks = t || [];
                  this._requests = [];
                  this._headersReady = Promise.resolve();
                  e._fullRequestReader = this;
                  this.onProgress = null
              }
              r.prototype = {
                  _enqueue: function e(t) {
                      if (this._done) {
                          return
                      }
                      if (this._requests.length > 0) {
                          var r = this._requests.shift();
                          r.resolve({
                              value: t,
                              done: false
                          });
                          return
                      }
                      this._queuedChunks.push(t)
                  },
                  get headersReady() {
                      return this._headersReady
                  },
                  get isRangeSupported() {
                      return this._stream._isRangeSupported
                  },
                  get isStreamingSupported() {
                      return this._stream._isStreamingSupported
                  },
                  get contentLength() {
                      return this._stream._contentLength
                  },
                  read: function e() {
                      if (this._queuedChunks.length > 0) {
                          var t = this._queuedChunks.shift();
                          return Promise.resolve({
                              value: t,
                              done: false
                          })
                      }
                      if (this._done) {
                          return Promise.resolve({
                              value: undefined,
                              done: true
                          })
                      }
                      var r = (0,
                      n.createPromiseCapability)();
                      this._requests.push(r);
                      return r.promise
                  },
                  cancel: function e(t) {
                      this._done = true;
                      this._requests.forEach(function(e) {
                          e.resolve({
                              value: undefined,
                              done: true
                          })
                      });
                      this._requests = []
                  }
              };
              function a(e, t, r) {
                  this._stream = e;
                  this._begin = t;
                  this._end = r;
                  this._queuedChunk = null;
                  this._requests = [];
                  this._done = false;
                  this.onProgress = null
              }
              a.prototype = {
                  _enqueue: function e(t) {
                      if (this._done) {
                          return
                      }
                      if (this._requests.length === 0) {
                          this._queuedChunk = t
                      } else {
                          var r = this._requests.shift();
                          r.resolve({
                              value: t,
                              done: false
                          });
                          this._requests.forEach(function(e) {
                              e.resolve({
                                  value: undefined,
                                  done: true
                              })
                          });
                          this._requests = []
                      }
                      this._done = true;
                      this._stream._removeRangeReader(this)
                  },
                  get isStreamingSupported() {
                      return false
                  },
                  read: function e() {
                      if (this._queuedChunk) {
                          var t = this._queuedChunk;
                          this._queuedChunk = null;
                          return Promise.resolve({
                              value: t,
                              done: false
                          })
                      }
                      if (this._done) {
                          return Promise.resolve({
                              value: undefined,
                              done: true
                          })
                      }
                      var r = (0,
                      n.createPromiseCapability)();
                      this._requests.push(r);
                      return r.promise
                  },
                  cancel: function e(t) {
                      this._done = true;
                      this._requests.forEach(function(e) {
                          e.resolve({
                              value: undefined,
                              done: true
                          })
                      });
                      this._requests = [];
                      this._stream._removeRangeReader(this)
                  }
              };
              return t
          }();
          t.PDFDataTransportStream = a
      }
      , function(e, t, r) {
          "use strict";
          var n = "1.9.426";
          var a = "2558a58d";
          var i = r(0);
          var s = r(8);
          var o = r(2);
          var l = r(5);
          var u = r(3);
          var c = r(1);
          var f = r(4);
          {
              r(9)
          }
          t.PDFJS = s.PDFJS;
          t.build = o.build;
          t.version = o.version;
          t.getDocument = o.getDocument;
          t.LoopbackPort = o.LoopbackPort;
          t.PDFDataRangeTransport = o.PDFDataRangeTransport;
          t.PDFWorker = o.PDFWorker;
          t.renderTextLayer = l.renderTextLayer;
          t.AnnotationLayer = u.AnnotationLayer;
          t.CustomStyle = c.CustomStyle;
          t.createPromiseCapability = i.createPromiseCapability;
          t.PasswordResponses = i.PasswordResponses;
          t.InvalidPDFException = i.InvalidPDFException;
          t.MissingPDFException = i.MissingPDFException;
          t.SVGGraphics = f.SVGGraphics;
          t.NativeImageDecoding = i.NativeImageDecoding;
          t.UnexpectedResponseException = i.UnexpectedResponseException;
          t.OPS = i.OPS;
          t.UNSUPPORTED_FEATURES = i.UNSUPPORTED_FEATURES;
          t.isValidUrl = c.isValidUrl;
          t.createValidAbsoluteUrl = i.createValidAbsoluteUrl;
          t.createObjectURL = i.createObjectURL;
          t.removeNullCharacters = i.removeNullCharacters;
          t.shadow = i.shadow;
          t.createBlob = i.createBlob;
          t.RenderingCancelledException = c.RenderingCancelledException;
          t.getFilenameFromUrl = c.getFilenameFromUrl;
          t.addLinkAttributes = c.addLinkAttributes;
          t.StatTimer = i.StatTimer
      }
      , function(e, t, r) {
          "use strict";
          var n = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(e) {
              return typeof e
          }
          : function(e) {
              return e && typeof Symbol === "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
          }
          ;
          if (typeof PDFJS === "undefined" || !PDFJS.compatibilityChecked) {
              var a = typeof window !== "undefined" && window.Math === Math ? window : typeof global !== "undefined" && global.Math === Math ? global : typeof self !== "undefined" && self.Math === Math ? self : false ? undefined : {};
              var i = typeof navigator !== "undefined" && navigator.userAgent || "";
              var s = /Android/.test(i);
              var o = /Android\s[0-2][^\d]/.test(i);
              var l = /Android\s[0-4][^\d]/.test(i);
              var u = i.indexOf("Chrom") >= 0;
              var c = /Chrome\/(39|40)\./.test(i);
              var f = i.indexOf("CriOS") >= 0;
              var d = i.indexOf("Trident") >= 0;
              var h = /\b(iPad|iPhone|iPod)(?=;)/.test(i);
              var p = i.indexOf("Opera") >= 0;
              var v = /Safari\//.test(i) && !/(Chrome\/|Android\s)/.test(i);
              var m = (typeof window === "undefined" ? "undefined" : n(window)) === "object" && (typeof document === "undefined" ? "undefined" : n(document)) === "object";
              if (typeof PDFJS === "undefined") {
                  a.PDFJS = {}
              }
              PDFJS.compatibilityChecked = true;
              (function e() {
                  if (typeof Uint8Array !== "undefined") {
                      if (typeof Uint8Array.prototype.subarray === "undefined") {
                          Uint8Array.prototype.subarray = function e(t, r) {
                              return new Uint8Array(this.slice(t, r))
                          }
                          ;
                          Float32Array.prototype.subarray = function e(t, r) {
                              return new Float32Array(this.slice(t, r))
                          }
                      }
                      if (typeof Float64Array === "undefined") {
                          a.Float64Array = Float32Array
                      }
                      return
                  }
                  function t(e, t) {
                      return new u(this.slice(e, t))
                  }
                  function r(e, t) {
                      if (arguments.length < 2) {
                          t = 0
                      }
                      for (var r = 0, n = e.length; r < n; ++r,
                      ++t) {
                          this[t] = e[r] & 255
                      }
                  }
                  function i(e, t) {
                      this.buffer = e;
                      this.byteLength = e.length;
                      this.length = t;
                      l(this.length)
                  }
                  i.prototype = Object.create(null);
                  var s = 0;
                  function o(e) {
                      return {
                          get: function t() {
                              var r = this.buffer
                                , n = e << 2;
                              return (r[n] | r[n + 1] << 8 | r[n + 2] << 16 | r[n + 3] << 24) >>> 0
                          },
                          set: function t(r) {
                              var n = this.buffer
                                , a = e << 2;
                              n[a] = r & 255;
                              n[a + 1] = r >> 8 & 255;
                              n[a + 2] = r >> 16 & 255;
                              n[a + 3] = r >>> 24 & 255
                          }
                      }
                  }
                  function l(e) {
                      while (s < e) {
                          Object.defineProperty(i.prototype, s, o(s));
                          s++
                      }
                  }
                  function u(e) {
                      var a, i, s;
                      if (typeof e === "number") {
                          a = [];
                          for (i = 0; i < e; ++i) {
                              a[i] = 0
                          }
                      } else if ("slice"in e) {
                          a = e.slice(0)
                      } else {
                          a = [];
                          for (i = 0,
                          s = e.length; i < s; ++i) {
                              a[i] = e[i]
                          }
                      }
                      a.subarray = t;
                      a.buffer = a;
                      a.byteLength = a.length;
                      a.set = r;
                      if ((typeof e === "undefined" ? "undefined" : n(e)) === "object" && e.buffer) {
                          a.buffer = e.buffer
                      }
                      return a
                  }
                  a.Uint8Array = u;
                  a.Int8Array = u;
                  a.Int32Array = u;
                  a.Uint16Array = u;
                  a.Float32Array = u;
                  a.Float64Array = u;
                  a.Uint32Array = function() {
                      if (arguments.length === 3) {
                          if (arguments[1] !== 0) {
                              throw new Error("offset !== 0 is not supported")
                          }
                          return new i(arguments[0],arguments[2])
                      }
                      return u.apply(this, arguments)
                  }
              }
              )();
              (function e() {
                  if (!m || !window.CanvasPixelArray) {
                      return
                  }
                  var t = window.CanvasPixelArray.prototype;
                  if ("buffer"in t) {
                      return
                  }
                  Object.defineProperty(t, "buffer", {
                      get: function e() {
                          return this
                      },
                      enumerable: false,
                      configurable: true
                  });
                  Object.defineProperty(t, "byteLength", {
                      get: function e() {
                          return this.length
                      },
                      enumerable: false,
                      configurable: true
                  })
              }
              )();
              (function e() {
                  if (!a.URL) {
                      a.URL = a.webkitURL
                  }
              }
              )();
              (function e() {
                  if (typeof Object.defineProperty !== "undefined") {
                      var t = true;
                      try {
                          if (m) {
                              Object.defineProperty(new Image, "id", {
                                  value: "test"
                              })
                          }
                          var r = function e() {};
                          r.prototype = {
                              get id() {}
                          };
                          Object.defineProperty(new r, "id", {
                              value: "",
                              configurable: true,
                              enumerable: true,
                              writable: false
                          })
                      } catch (e) {
                          t = false
                      }
                      if (t) {
                          return
                      }
                  }
                  Object.defineProperty = function e(t, r, n) {
                      delete t[r];
                      if ("get"in n) {
                          t.__defineGetter__(r, n["get"])
                      }
                      if ("set"in n) {
                          t.__defineSetter__(r, n["set"])
                      }
                      if ("value"in n) {
                          t.__defineSetter__(r, function e(t) {
                              this.__defineGetter__(r, function e() {
                                  return t
                              });
                              return t
                          });
                          t[r] = n.value
                      }
                  }
              }
              )();
              (function e() {
                  if (typeof XMLHttpRequest === "undefined") {
                      return
                  }
                  var t = XMLHttpRequest.prototype;
                  var r = new XMLHttpRequest;
                  if (!("overrideMimeType"in r)) {
                      Object.defineProperty(t, "overrideMimeType", {
                          value: function e(t) {}
                      })
                  }
                  if ("responseType"in r) {
                      return
                  }
                  Object.defineProperty(t, "responseType", {
                      get: function e() {
                          return this._responseType || "text"
                      },
                      set: function e(t) {
                          if (t === "text" || t === "arraybuffer") {
                              this._responseType = t;
                              if (t === "arraybuffer" && typeof this.overrideMimeType === "function") {
                                  this.overrideMimeType("text/plain; charset=x-user-defined")
                              }
                          }
                      }
                  });
                  if (typeof VBArray !== "undefined") {
                      Object.defineProperty(t, "response", {
                          get: function e() {
                              if (this.responseType === "arraybuffer") {
                                  return new Uint8Array(new VBArray(this.responseBody).toArray())
                              }
                              return this.responseText
                          }
                      });
                      return
                  }
                  Object.defineProperty(t, "response", {
                      get: function e() {
                          if (this.responseType !== "arraybuffer") {
                              return this.responseText
                          }
                          var t = this.responseText;
                          var r, n = t.length;
                          var a = new Uint8Array(n);
                          for (r = 0; r < n; ++r) {
                              a[r] = t.charCodeAt(r) & 255
                          }
                          return a.buffer
                      }
                  })
              }
              )();
              (function e() {
                  if ("btoa"in a) {
                      return
                  }
                  var t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
                  a.btoa = function(e) {
                      var r = "";
                      var n, a;
                      for (n = 0,
                      a = e.length; n < a; n += 3) {
                          var i = e.charCodeAt(n) & 255;
                          var s = e.charCodeAt(n + 1) & 255;
                          var o = e.charCodeAt(n + 2) & 255;
                          var l = i >> 2
                            , u = (i & 3) << 4 | s >> 4;
                          var c = n + 1 < a ? (s & 15) << 2 | o >> 6 : 64;
                          var f = n + 2 < a ? o & 63 : 64;
                          r += t.charAt(l) + t.charAt(u) + t.charAt(c) + t.charAt(f)
                      }
                      return r
                  }
              }
              )();
              (function e() {
                  if ("atob"in a) {
                      return
                  }
                  var t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
                  a.atob = function(e) {
                      e = e.replace(/=+$/, "");
                      if (e.length % 4 === 1) {
                          throw new Error("bad atob input")
                      }
                      for (var r = 0, n, a, i = 0, s = ""; a = e.charAt(i++); ~a && (n = r % 4 ? n * 64 + a : a,
                      r++ % 4) ? s += String.fromCharCode(255 & n >> (-2 * r & 6)) : 0) {
                          a = t.indexOf(a)
                      }
                      return s
                  }
              }
              )();
              (function e() {
                  if (typeof Function.prototype.bind !== "undefined") {
                      return
                  }
                  Function.prototype.bind = function e(t) {
                      var r = this
                        , n = Array.prototype.slice.call(arguments, 1);
                      var a = function e() {
                          var a = n.concat(Array.prototype.slice.call(arguments));
                          return r.apply(t, a)
                      };
                      return a
                  }
              }
              )();
              (function e() {
                  if (!m) {
                      return
                  }
                  var t = document.createElement("div");
                  if ("dataset"in t) {
                      return
                  }
                  Object.defineProperty(HTMLElement.prototype, "dataset", {
                      get: function e() {
                          if (this._dataset) {
                              return this._dataset
                          }
                          var t = {};
                          for (var r = 0, n = this.attributes.length; r < n; r++) {
                              var a = this.attributes[r];
                              if (a.name.substring(0, 5) !== "data-") {
                                  continue
                              }
                              var i = a.name.substring(5).replace(/\-([a-z])/g, function(e, t) {
                                  return t.toUpperCase()
                              });
                              t[i] = a.value
                          }
                          Object.defineProperty(this, "_dataset", {
                              value: t,
                              writable: false,
                              enumerable: false
                          });
                          return t
                      },
                      enumerable: true
                  })
              }
              )();
              (function e() {
                  function t(e, t, r, n) {
                      var a = e.className || "";
                      var i = a.split(/\s+/g);
                      if (i[0] === "") {
                          i.shift()
                      }
                      var s = i.indexOf(t);
                      if (s < 0 && r) {
                          i.push(t)
                      }
                      if (s >= 0 && n) {
                          i.splice(s, 1)
                      }
                      e.className = i.join(" ");
                      return s >= 0
                  }
                  if (!m) {
                      return
                  }
                  var r = document.createElement("div");
                  if ("classList"in r) {
                      return
                  }
                  var n = {
                      add: function e(r) {
                          t(this.element, r, true, false)
                      },
                      contains: function e(r) {
                          return t(this.element, r, false, false)
                      },
                      remove: function e(r) {
                          t(this.element, r, false, true)
                      },
                      toggle: function e(r) {
                          t(this.element, r, true, true)
                      }
                  };
                  Object.defineProperty(HTMLElement.prototype, "classList", {
                      get: function e() {
                          if (this._classList) {
                              return this._classList
                          }
                          var t = Object.create(n, {
                              element: {
                                  value: this,
                                  writable: false,
                                  enumerable: true
                              }
                          });
                          Object.defineProperty(this, "_classList", {
                              value: t,
                              writable: false,
                              enumerable: false
                          });
                          return t
                      },
                      enumerable: true
                  })
              }
              )();
              (function e() {
                  if (typeof importScripts === "undefined" || "console"in a) {
                      return
                  }
                  var t = {};
                  var r = {
                      log: function e() {
                          var t = Array.prototype.slice.call(arguments);
                          a.postMessage({
                              targetName: "main",
                              action: "console_log",
                              data: t
                          })
                      },
                      error: function e() {
                          var t = Array.prototype.slice.call(arguments);
                          a.postMessage({
                              targetName: "main",
                              action: "console_error",
                              data: t
                          })
                      },
                      time: function e(r) {
                          t[r] = Date.now()
                      },
                      timeEnd: function e(r) {
                          var n = t[r];
                          if (!n) {
                              throw new Error("Unknown timer name " + r)
                          }
                          this.log("Timer:", r, Date.now() - n)
                      }
                  };
                  a.console = r
              }
              )();
              (function e() {
                  if (!m) {
                      return
                  }
                  if (!("console"in window)) {
                      window.console = {
                          log: function e() {},
                          error: function e() {},
                          warn: function e() {}
                      };
                      return
                  }
                  if (!("bind"in console.log)) {
                      console.log = function(e) {
                          return function(t) {
                              return e(t)
                          }
                      }(console.log);
                      console.error = function(e) {
                          return function(t) {
                              return e(t)
                          }
                      }(console.error);
                      console.warn = function(e) {
                          return function(t) {
                              return e(t)
                          }
                      }(console.warn);
                      return
                  }
              }
              )();
              (function e() {
                  function t(e) {
                      if (r(e.target)) {
                          e.stopPropagation()
                      }
                  }
                  function r(e) {
                      return e.disabled || e.parentNode && r(e.parentNode)
                  }
                  if (p) {
                      document.addEventListener("click", t, true)
                  }
              }
              )();
              (function e() {
                  if (d || f) {
                      PDFJS.disableCreateObjectURL = true
                  }
              }
              )();
              (function e() {
                  if (typeof navigator === "undefined") {
                      return
                  }
                  if ("language"in navigator) {
                      return
                  }
                  PDFJS.locale = navigator.userLanguage || "en-US"
              }
              )();
              (function e() {
                  if (v || o || c || h) {
                      PDFJS.disableRange = true;
                      PDFJS.disableStream = true
                  }
              }
              )();
              (function e() {
                  if (!m) {
                      return
                  }
                  if (!history.pushState || o) {
                      PDFJS.disableHistory = true
                  }
              }
              )();
              (function e() {
                  if (!m) {
                      return
                  }
                  if (window.CanvasPixelArray) {
                      if (typeof window.CanvasPixelArray.prototype.set !== "function") {
                          window.CanvasPixelArray.prototype.set = function(e) {
                              for (var t = 0, r = this.length; t < r; t++) {
                                  this[t] = e[t]
                              }
                          }
                      }
                  } else {
                      var t = false, r;
                      if (u) {
                          r = i.match(/Chrom(e|ium)\/([0-9]+)\./);
                          t = r && parseInt(r[2]) < 21
                      } else if (s) {
                          t = l
                      } else if (v) {
                          r = i.match(/Version\/([0-9]+)\.([0-9]+)\.([0-9]+) Safari\//);
                          t = r && parseInt(r[1]) < 6
                      }
                      if (t) {
                          var n = window.CanvasRenderingContext2D.prototype;
                          var a = n.createImageData;
                          n.createImageData = function(e, t) {
                              var r = a.call(this, e, t);
                              r.data.set = function(e) {
                                  for (var t = 0, r = this.length; t < r; t++) {
                                      this[t] = e[t]
                                  }
                              }
                              ;
                              return r
                          }
                          ;
                          n = null
                      }
                  }
              }
              )();
              (function e() {
                  function t() {
                      window.requestAnimationFrame = function(e) {
                          return window.setTimeout(e, 20)
                      }
                      ;
                      window.cancelAnimationFrame = function(e) {
                          window.clearTimeout(e)
                      }
                  }
                  if (!m) {
                      return
                  }
                  if (h) {
                      t();
                      return
                  }
                  if ("requestAnimationFrame"in window) {
                      return
                  }
                  window.requestAnimationFrame = window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame;
                  if (window.requestAnimationFrame) {
                      return
                  }
                  t()
              }
              )();
              (function e() {
                  if (h || s) {
                      PDFJS.maxCanvasPixels = 5242880
                  }
              }
              )();
              (function e() {
                  if (!m) {
                      return
                  }
                  if (d && window.parent !== window) {
                      PDFJS.disableFullscreen = true
                  }
              }
              )();
              (function e() {
                  if (!m) {
                      return
                  }
                  if ("currentScript"in document) {
                      return
                  }
                  Object.defineProperty(document, "currentScript", {
                      get: function e() {
                          var t = document.getElementsByTagName("script");
                          return t[t.length - 1]
                      },
                      enumerable: true,
                      configurable: true
                  })
              }
              )();
              (function e() {
                  if (!m) {
                      return
                  }
                  var t = document.createElement("input");
                  try {
                      t.type = "number"
                  } catch (e) {
                      var r = t.constructor.prototype;
                      var n = Object.getOwnPropertyDescriptor(r, "type");
                      Object.defineProperty(r, "type", {
                          get: function e() {
                              return n.get.call(this)
                          },
                          set: function e(t) {
                              n.set.call(this, t === "number" ? "text" : t)
                          },
                          enumerable: true,
                          configurable: true
                      })
                  }
              }
              )();
              (function e() {
                  if (!m) {
                      return
                  }
                  if (!document.attachEvent) {
                      return
                  }
                  var t = document.constructor.prototype;
                  var r = Object.getOwnPropertyDescriptor(t, "readyState");
                  Object.defineProperty(t, "readyState", {
                      get: function e() {
                          var t = r.get.call(this);
                          return t === "interactive" ? "loading" : t
                      },
                      set: function e(t) {
                          r.set.call(this, t)
                      },
                      enumerable: true,
                      configurable: true
                  })
              }
              )();
              (function e() {
                  if (!m) {
                      return
                  }
                  if (typeof Element.prototype.remove !== "undefined") {
                      return
                  }
                  Element.prototype.remove = function() {
                      if (this.parentNode) {
                          this.parentNode.removeChild(this)
                      }
                  }
              }
              )();
              (function e() {
                  if (Number.isNaN) {
                      return
                  }
                  Number.isNaN = function(e) {
                      return typeof e === "number" && isNaN(e)
                  }
              }
              )();
              (function e() {
                  if (Number.isInteger) {
                      return
                  }
                  Number.isInteger = function(e) {
                      return typeof e === "number" && isFinite(e) && Math.floor(e) === e
                  }
              }
              )();
              (function e() {
                  if (a.Promise) {
                      if (typeof a.Promise.all !== "function") {
                          a.Promise.all = function(e) {
                              var t = 0, r = [], n, i;
                              var s = new a.Promise(function(e, t) {
                                  n = e;
                                  i = t
                              }
                              );
                              e.forEach(function(e, a) {
                                  t++;
                                  e.then(function(e) {
                                      r[a] = e;
                                      t--;
                                      if (t === 0) {
                                          n(r)
                                      }
                                  }, i)
                              });
                              if (t === 0) {
                                  n(r)
                              }
                              return s
                          }
                      }
                      if (typeof a.Promise.resolve !== "function") {
                          a.Promise.resolve = function(e) {
                              return new a.Promise(function(t) {
                                  t(e)
                              }
                              )
                          }
                      }
                      if (typeof a.Promise.reject !== "function") {
                          a.Promise.reject = function(e) {
                              return new a.Promise(function(t, r) {
                                  r(e)
                              }
                              )
                          }
                      }
                      if (typeof a.Promise.prototype.catch !== "function") {
                          a.Promise.prototype.catch = function(e) {
                              return a.Promise.prototype.then(undefined, e)
                          }
                      }
                      return
                  }
                  var t = 0;
                  var r = 1;
                  var n = 2;
                  var i = 500;
                  var s = {
                      handlers: [],
                      running: false,
                      unhandledRejections: [],
                      pendingRejectionCheck: false,
                      scheduleHandlers: function e(r) {
                          if (r._status === t) {
                              return
                          }
                          this.handlers = this.handlers.concat(r._handlers);
                          r._handlers = [];
                          if (this.running) {
                              return
                          }
                          this.running = true;
                          setTimeout(this.runHandlers.bind(this), 0)
                      },
                      runHandlers: function e() {
                          var t = 1;
                          var a = Date.now() + t;
                          while (this.handlers.length > 0) {
                              var i = this.handlers.shift();
                              var s = i.thisPromise._status;
                              var o = i.thisPromise._value;
                              try {
                                  if (s === r) {
                                      if (typeof i.onResolve === "function") {
                                          o = i.onResolve(o)
                                      }
                                  } else if (typeof i.onReject === "function") {
                                      o = i.onReject(o);
                                      s = r;
                                      if (i.thisPromise._unhandledRejection) {
                                          this.removeUnhandeledRejection(i.thisPromise)
                                      }
                                  }
                              } catch (e) {
                                  s = n;
                                  o = e
                              }
                              i.nextPromise._updateStatus(s, o);
                              if (Date.now() >= a) {
                                  break
                              }
                          }
                          if (this.handlers.length > 0) {
                              setTimeout(this.runHandlers.bind(this), 0);
                              return
                          }
                          this.running = false
                      },
                      addUnhandledRejection: function e(t) {
                          this.unhandledRejections.push({
                              promise: t,
                              time: Date.now()
                          });
                          this.scheduleRejectionCheck()
                      },
                      removeUnhandeledRejection: function e(t) {
                          t._unhandledRejection = false;
                          for (var r = 0; r < this.unhandledRejections.length; r++) {
                              if (this.unhandledRejections[r].promise === t) {
                                  this.unhandledRejections.splice(r);
                                  r--
                              }
                          }
                      },
                      scheduleRejectionCheck: function e() {
                          var t = this;
                          if (this.pendingRejectionCheck) {
                              return
                          }
                          this.pendingRejectionCheck = true;
                          setTimeout(function() {
                              t.pendingRejectionCheck = false;
                              var e = Date.now();
                              for (var r = 0; r < t.unhandledRejections.length; r++) {
                                  if (e - t.unhandledRejections[r].time > i) {
                                      var n = t.unhandledRejections[r].promise._value;
                                      var a = "Unhandled rejection: " + n;
                                      if (n.stack) {
                                          a += "\n" + n.stack
                                      }
                                      try {
                                          throw new Error(a)
                                      } catch (e) {
                                          console.warn(a)
                                      }
                                      t.unhandledRejections.splice(r);
                                      r--
                                  }
                              }
                              if (t.unhandledRejections.length) {
                                  t.scheduleRejectionCheck()
                              }
                          }, i)
                      }
                  };
                  var o = function e(r) {
                      this._status = t;
                      this._handlers = [];
                      try {
                          r.call(this, this._resolve.bind(this), this._reject.bind(this))
                      } catch (e) {
                          this._reject(e)
                      }
                  };
                  o.all = function e(t) {
                      var r, a;
                      var i = new o(function(e, t) {
                          r = e;
                          a = t
                      }
                      );
                      var s = t.length;
                      var l = [];
                      if (s === 0) {
                          r(l);
                          return i
                      }
                      function u(e) {
                          if (i._status === n) {
                              return
                          }
                          l = [];
                          a(e)
                      }
                      for (var c = 0, f = t.length; c < f; ++c) {
                          var d = t[c];
                          var h = function(e) {
                              return function(t) {
                                  if (i._status === n) {
                                      return
                                  }
                                  l[e] = t;
                                  s--;
                                  if (s === 0) {
                                      r(l)
                                  }
                              }
                          }(c);
                          if (o.isPromise(d)) {
                              d.then(h, u)
                          } else {
                              h(d)
                          }
                      }
                      return i
                  }
                  ;
                  o.isPromise = function e(t) {
                      return t && typeof t.then === "function"
                  }
                  ;
                  o.resolve = function e(t) {
                      return new o(function(e) {
                          e(t)
                      }
                      )
                  }
                  ;
                  o.reject = function e(t) {
                      return new o(function(e, r) {
                          r(t)
                      }
                      )
                  }
                  ;
                  o.prototype = {
                      _status: null,
                      _value: null,
                      _handlers: null,
                      _unhandledRejection: null,
                      _updateStatus: function e(t, a) {
                          if (this._status === r || this._status === n) {
                              return
                          }
                          if (t === r && o.isPromise(a)) {
                              a.then(this._updateStatus.bind(this, r), this._updateStatus.bind(this, n));
                              return
                          }
                          this._status = t;
                          this._value = a;
                          if (t === n && this._handlers.length === 0) {
                              this._unhandledRejection = true;
                              s.addUnhandledRejection(this)
                          }
                          s.scheduleHandlers(this)
                      },
                      _resolve: function e(t) {
                          this._updateStatus(r, t)
                      },
                      _reject: function e(t) {
                          this._updateStatus(n, t)
                      },
                      then: function e(t, r) {
                          var n = new o(function(e, t) {
                              this.resolve = e;
                              this.reject = t
                          }
                          );
                          this._handlers.push({
                              thisPromise: this,
                              onResolve: t,
                              onReject: r,
                              nextPromise: n
                          });
                          s.scheduleHandlers(this);
                          return n
                      },
                      catch: function e(t) {
                          return this.then(undefined, t)
                      }
                  };
                  a.Promise = o
              }
              )();
              (function e() {
                  if (a.WeakMap) {
                      return
                  }
                  var t = 0;
                  function r() {
                      this.id = "$weakmap" + t++
                  }
                  r.prototype = {
                      has: function e(t) {
                          if ((typeof t === "undefined" ? "undefined" : n(t)) !== "object" && typeof t !== "function" || t === null) {
                              return false
                          }
                          return !!Object.getOwnPropertyDescriptor(t, this.id)
                      },
                      get: function e(t) {
                          return this.has(t) ? t[this.id] : undefined
                      },
                      set: function e(t, r) {
                          Object.defineProperty(t, this.id, {
                              value: r,
                              enumerable: false,
                              configurable: true
                          })
                      },
                      delete: function e(t) {
                          delete t[this.id]
                      }
                  };
                  a.WeakMap = r
              }
              )();
              (function e() {
                  var t = false;
                  try {
                      if (typeof URL === "function" && n(URL.prototype) === "object" && "origin"in URL.prototype) {
                          var r = new URL("b","http://a");
                          r.pathname = "c%20d";
                          t = r.href === "http://a/c%20d"
                      }
                  } catch (e) {}
                  if (t) {
                      return
                  }
                  var i = Object.create(null);
                  i["ftp"] = 21;
                  i["file"] = 0;
                  i["gopher"] = 70;
                  i["http"] = 80;
                  i["https"] = 443;
                  i["ws"] = 80;
                  i["wss"] = 443;
                  var s = Object.create(null);
                  s["%2e"] = ".";
                  s[".%2e"] = "..";
                  s["%2e."] = "..";
                  s["%2e%2e"] = "..";
                  function o(e) {
                      return i[e] !== undefined
                  }
                  function l() {
                      m.call(this);
                      this._isInvalid = true
                  }
                  function u(e) {
                      if (e === "") {
                          l.call(this)
                      }
                      return e.toLowerCase()
                  }
                  function c(e) {
                      var t = e.charCodeAt(0);
                      if (t > 32 && t < 127 && [34, 35, 60, 62, 63, 96].indexOf(t) === -1) {
                          return e
                      }
                      return encodeURIComponent(e)
                  }
                  function f(e) {
                      var t = e.charCodeAt(0);
                      if (t > 32 && t < 127 && [34, 35, 60, 62, 96].indexOf(t) === -1) {
                          return e
                      }
                      return encodeURIComponent(e)
                  }
                  var d, h = /[a-zA-Z]/, p = /[a-zA-Z0-9\+\-\.]/;
                  function v(e, t, r) {
                      function n(e) {
                          _.push(e)
                      }
                      var a = t || "scheme start"
                        , v = 0
                        , m = ""
                        , g = false
                        , b = false
                        , _ = [];
                      e: while ((e[v - 1] !== d || v === 0) && !this._isInvalid) {
                          var y = e[v];
                          switch (a) {
                          case "scheme start":
                              if (y && h.test(y)) {
                                  m += y.toLowerCase();
                                  a = "scheme"
                              } else if (!t) {
                                  m = "";
                                  a = "no scheme";
                                  continue
                              } else {
                                  n("Invalid scheme.");
                                  break e
                              }
                              break;
                          case "scheme":
                              if (y && p.test(y)) {
                                  m += y.toLowerCase()
                              } else if (y === ":") {
                                  this._scheme = m;
                                  m = "";
                                  if (t) {
                                      break e
                                  }
                                  if (o(this._scheme)) {
                                      this._isRelative = true
                                  }
                                  if (this._scheme === "file") {
                                      a = "relative"
                                  } else if (this._isRelative && r && r._scheme === this._scheme) {
                                      a = "relative or authority"
                                  } else if (this._isRelative) {
                                      a = "authority first slash"
                                  } else {
                                      a = "scheme data"
                                  }
                              } else if (!t) {
                                  m = "";
                                  v = 0;
                                  a = "no scheme";
                                  continue
                              } else if (y === d) {
                                  break e
                              } else {
                                  n("Code point not allowed in scheme: " + y);
                                  break e
                              }
                              break;
                          case "scheme data":
                              if (y === "?") {
                                  this._query = "?";
                                  a = "query"
                              } else if (y === "#") {
                                  this._fragment = "#";
                                  a = "fragment"
                              } else {
                                  if (y !== d && y !== "\t" && y !== "\n" && y !== "\r") {
                                      this._schemeData += c(y)
                                  }
                              }
                              break;
                          case "no scheme":
                              if (!r || !o(r._scheme)) {
                                  n("Missing scheme.");
                                  l.call(this)
                              } else {
                                  a = "relative";
                                  continue
                              }
                              break;
                          case "relative or authority":
                              if (y === "/" && e[v + 1] === "/") {
                                  a = "authority ignore slashes"
                              } else {
                                  n("Expected /, got: " + y);
                                  a = "relative";
                                  continue
                              }
                              break;
                          case "relative":
                              this._isRelative = true;
                              if (this._scheme !== "file") {
                                  this._scheme = r._scheme
                              }
                              if (y === d) {
                                  this._host = r._host;
                                  this._port = r._port;
                                  this._path = r._path.slice();
                                  this._query = r._query;
                                  this._username = r._username;
                                  this._password = r._password;
                                  break e
                              } else if (y === "/" || y === "\\") {
                                  if (y === "\\") {
                                      n("\\ is an invalid code point.")
                                  }
                                  a = "relative slash"
                              } else if (y === "?") {
                                  this._host = r._host;
                                  this._port = r._port;
                                  this._path = r._path.slice();
                                  this._query = "?";
                                  this._username = r._username;
                                  this._password = r._password;
                                  a = "query"
                              } else if (y === "#") {
                                  this._host = r._host;
                                  this._port = r._port;
                                  this._path = r._path.slice();
                                  this._query = r._query;
                                  this._fragment = "#";
                                  this._username = r._username;
                                  this._password = r._password;
                                  a = "fragment"
                              } else {
                                  var A = e[v + 1];
                                  var S = e[v + 2];
                                  if (this._scheme !== "file" || !h.test(y) || A !== ":" && A !== "|" || S !== d && S !== "/" && S !== "\\" && S !== "?" && S !== "#") {
                                      this._host = r._host;
                                      this._port = r._port;
                                      this._username = r._username;
                                      this._password = r._password;
                                      this._path = r._path.slice();
                                      this._path.pop()
                                  }
                                  a = "relative path";
                                  continue
                              }
                              break;
                          case "relative slash":
                              if (y === "/" || y === "\\") {
                                  if (y === "\\") {
                                      n("\\ is an invalid code point.")
                                  }
                                  if (this._scheme === "file") {
                                      a = "file host"
                                  } else {
                                      a = "authority ignore slashes"
                                  }
                              } else {
                                  if (this._scheme !== "file") {
                                      this._host = r._host;
                                      this._port = r._port;
                                      this._username = r._username;
                                      this._password = r._password
                                  }
                                  a = "relative path";
                                  continue
                              }
                              break;
                          case "authority first slash":
                              if (y === "/") {
                                  a = "authority second slash"
                              } else {
                                  n("Expected '/', got: " + y);
                                  a = "authority ignore slashes";
                                  continue
                              }
                              break;
                          case "authority second slash":
                              a = "authority ignore slashes";
                              if (y !== "/") {
                                  n("Expected '/', got: " + y);
                                  continue
                              }
                              break;
                          case "authority ignore slashes":
                              if (y !== "/" && y !== "\\") {
                                  a = "authority";
                                  continue
                              } else {
                                  n("Expected authority, got: " + y)
                              }
                              break;
                          case "authority":
                              if (y === "@") {
                                  if (g) {
                                      n("@ already seen.");
                                      m += "%40"
                                  }
                                  g = true;
                                  for (var w = 0; w < m.length; w++) {
                                      var P = m[w];
                                      if (P === "\t" || P === "\n" || P === "\r") {
                                          n("Invalid whitespace in authority.");
                                          continue
                                      }
                                      if (P === ":" && this._password === null) {
                                          this._password = "";
                                          continue
                                      }
                                      var C = c(P);
                                      if (this._password !== null) {
                                          this._password += C
                                      } else {
                                          this._username += C
                                      }
                                  }
                                  m = ""
                              } else if (y === d || y === "/" || y === "\\" || y === "?" || y === "#") {
                                  v -= m.length;
                                  m = "";
                                  a = "host";
                                  continue
                              } else {
                                  m += y
                              }
                              break;
                          case "file host":
                              if (y === d || y === "/" || y === "\\" || y === "?" || y === "#") {
                                  if (m.length === 2 && h.test(m[0]) && (m[1] === ":" || m[1] === "|")) {
                                      a = "relative path"
                                  } else if (m.length === 0) {
                                      a = "relative path start"
                                  } else {
                                      this._host = u.call(this, m);
                                      m = "";
                                      a = "relative path start"
                                  }
                                  continue
                              } else if (y === "\t" || y === "\n" || y === "\r") {
                                  n("Invalid whitespace in file host.")
                              } else {
                                  m += y
                              }
                              break;
                          case "host":
                          case "hostname":
                              if (y === ":" && !b) {
                                  this._host = u.call(this, m);
                                  m = "";
                                  a = "port";
                                  if (t === "hostname") {
                                      break e
                                  }
                              } else if (y === d || y === "/" || y === "\\" || y === "?" || y === "#") {
                                  this._host = u.call(this, m);
                                  m = "";
                                  a = "relative path start";
                                  if (t) {
                                      break e
                                  }
                                  continue
                              } else if (y !== "\t" && y !== "\n" && y !== "\r") {
                                  if (y === "[") {
                                      b = true
                                  } else if (y === "]") {
                                      b = false
                                  }
                                  m += y
                              } else {
                                  n("Invalid code point in host/hostname: " + y)
                              }
                              break;
                          case "port":
                              if (/[0-9]/.test(y)) {
                                  m += y
                              } else if (y === d || y === "/" || y === "\\" || y === "?" || y === "#" || t) {
                                  if (m !== "") {
                                      var k = parseInt(m, 10);
                                      if (k !== i[this._scheme]) {
                                          this._port = k + ""
                                      }
                                      m = ""
                                  }
                                  if (t) {
                                      break e
                                  }
                                  a = "relative path start";
                                  continue
                              } else if (y === "\t" || y === "\n" || y === "\r") {
                                  n("Invalid code point in port: " + y)
                              } else {
                                  l.call(this)
                              }
                              break;
                          case "relative path start":
                              if (y === "\\") {
                                  n("'\\' not allowed in path.")
                              }
                              a = "relative path";
                              if (y !== "/" && y !== "\\") {
                                  continue
                              }
                              break;
                          case "relative path":
                              if (y === d || y === "/" || y === "\\" || !t && (y === "?" || y === "#")) {
                                  if (y === "\\") {
                                      n("\\ not allowed in relative path.")
                                  }
                                  var R;
                                  if (R = s[m.toLowerCase()]) {
                                      m = R
                                  }
                                  if (m === "..") {
                                      this._path.pop();
                                      if (y !== "/" && y !== "\\") {
                                          this._path.push("")
                                      }
                                  } else if (m === "." && y !== "/" && y !== "\\") {
                                      this._path.push("")
                                  } else if (m !== ".") {
                                      if (this._scheme === "file" && this._path.length === 0 && m.length === 2 && h.test(m[0]) && m[1] === "|") {
                                          m = m[0] + ":"
                                      }
                                      this._path.push(m)
                                  }
                                  m = "";
                                  if (y === "?") {
                                      this._query = "?";
                                      a = "query"
                                  } else if (y === "#") {
                                      this._fragment = "#";
                                      a = "fragment"
                                  }
                              } else if (y !== "\t" && y !== "\n" && y !== "\r") {
                                  m += c(y)
                              }
                              break;
                          case "query":
                              if (!t && y === "#") {
                                  this._fragment = "#";
                                  a = "fragment"
                              } else if (y !== d && y !== "\t" && y !== "\n" && y !== "\r") {
                                  this._query += f(y)
                              }
                              break;
                          case "fragment":
                              if (y !== d && y !== "\t" && y !== "\n" && y !== "\r") {
                                  this._fragment += y
                              }
                              break
                          }
                          v++
                      }
                  }
                  function m() {
                      this._scheme = "";
                      this._schemeData = "";
                      this._username = "";
                      this._password = null;
                      this._host = "";
                      this._port = "";
                      this._path = [];
                      this._query = "";
                      this._fragment = "";
                      this._isInvalid = false;
                      this._isRelative = false
                  }
                  function g(e, t) {
                      if (t !== undefined && !(t instanceof g)) {
                          t = new g(String(t))
                      }
                      this._url = e;
                      m.call(this);
                      var r = e.replace(/^[ \t\r\n\f]+|[ \t\r\n\f]+$/g, "");
                      v.call(this, r, null, t)
                  }
                  g.prototype = {
                      toString: function e() {
                          return this.href
                      },
                      get href() {
                          if (this._isInvalid) {
                              return this._url
                          }
                          var e = "";
                          if (this._username !== "" || this._password !== null) {
                              e = this._username + (this._password !== null ? ":" + this._password : "") + "@"
                          }
                          return this.protocol + (this._isRelative ? "//" + e + this.host : "") + this.pathname + this._query + this._fragment
                      },
                      set href(e) {
                          m.call(this);
                          v.call(this, e)
                      },
                      get protocol() {
                          return this._scheme + ":"
                      },
                      set protocol(e) {
                          if (this._isInvalid) {
                              return
                          }
                          v.call(this, e + ":", "scheme start")
                      },
                      get host() {
                          return this._isInvalid ? "" : this._port ? this._host + ":" + this._port : this._host
                      },
                      set host(e) {
                          if (this._isInvalid || !this._isRelative) {
                              return
                          }
                          v.call(this, e, "host")
                      },
                      get hostname() {
                          return this._host
                      },
                      set hostname(e) {
                          if (this._isInvalid || !this._isRelative) {
                              return
                          }
                          v.call(this, e, "hostname")
                      },
                      get port() {
                          return this._port
                      },
                      set port(e) {
                          if (this._isInvalid || !this._isRelative) {
                              return
                          }
                          v.call(this, e, "port")
                      },
                      get pathname() {
                          return this._isInvalid ? "" : this._isRelative ? "/" + this._path.join("/") : this._schemeData
                      },
                      set pathname(e) {
                          if (this._isInvalid || !this._isRelative) {
                              return
                          }
                          this._path = [];
                          v.call(this, e, "relative path start")
                      },
                      get search() {
                          return this._isInvalid || !this._query || this._query === "?" ? "" : this._query
                      },
                      set search(e) {
                          if (this._isInvalid || !this._isRelative) {
                              return
                          }
                          this._query = "?";
                          if (e[0] === "?") {
                              e = e.slice(1)
                          }
                          v.call(this, e, "query")
                      },
                      get hash() {
                          return this._isInvalid || !this._fragment || this._fragment === "#" ? "" : this._fragment
                      },
                      set hash(e) {
                          if (this._isInvalid) {
                              return
                          }
                          this._fragment = "#";
                          if (e[0] === "#") {
                              e = e.slice(1)
                          }
                          v.call(this, e, "fragment")
                      },
                      get origin() {
                          var e;
                          if (this._isInvalid || !this._scheme) {
                              return ""
                          }
                          switch (this._scheme) {
                          case "data":
                          case "file":
                          case "javascript":
                          case "mailto":
                              return "null";
                          case "blob":
                              try {
                                  return new g(this._schemeData).origin || "null"
                              } catch (e) {}
                              return "null"
                          }
                          e = this.host;
                          if (!e) {
                              return ""
                          }
                          return this._scheme + "://" + e
                      }
                  };
                  var b = a.URL;
                  if (b) {
                      g.createObjectURL = function(e) {
                          return b.createObjectURL.apply(b, arguments)
                      }
                      ;
                      g.revokeObjectURL = function(e) {
                          b.revokeObjectURL(e)
                      }
                  }
                  a.URL = g
              }
              )()
          }
      }
      , function(e, t, r) {
          "use strict";
          var n = false;
          if (typeof ReadableStream !== "undefined") {
              try {
                  new ReadableStream({
                      start: function e(t) {
                          t.close()
                      }
                  });
                  n = true
              } catch (e) {}
          }
          if (n) {
              t.ReadableStream = ReadableStream
          } else {
              t.ReadableStream = r(10).ReadableStream
          }
      }
      ])
  });







  'use strict';
  var pdfflip = pdfflip || {}
    , PRESENTATION = pdfflip;
  !function(_0xb07ax3, _0xb07ax4) {
      _0xb07ax3['version'] = '1.4.31',
      _0xb07ax3['PAGE_MODE'] = {
          SINGLE: 1,
          DOUBLE: 2,
          AUTO: null
      },
      _0xb07ax3['SINGLE_PAGE_MODE'] = {
          ZOOM: 1,
          BOOKLET: 2,
          AUTO: null
      },
      _0xb07ax3['CONTROLSPOSITION'] = {
          HIDDEN: 'hide',
          TOP: 'top',
          BOTTOM: 'bottom'
      },
      _0xb07ax3['DIRECTION'] = {
          LTR: 1,
          RTL: 2
      },
      _0xb07ax3['CORNERS'] = {
          TL: 'tl',
          TR: 'tr',
          BL: 'bl',
          BR: 'br',
          L: 'l',
          R: 'r',
          NONE: null
      },
      _0xb07ax3['SOURCE_TYPE'] = {
          IMAGE: 'image',
          PDF: 'pdf',
          HTML: 'html'
      },
      _0xb07ax3['DISPLAY_TYPE'] = {
          WEBGL: '3D',
          HTML: '2D'
      },
      _0xb07ax3['PAGE_SIZE'] = {
          AUTO: 0,
          SINGLE: 1,
          DOUBLEINTERNAL: 2
      };
      var _0xb07ax5, _0xb07ax6, _0xb07ax7, _0xb07ax8, _0xb07ax9 = _0xb07ax3['defaults'] = {
          webgl: !0,
          webglShadow: !0,
          enableSound: !0,
          height: '100%',
          autoEnableOutline: !1,
          autoEnableThumbnail: !1,
          overwritePDFOutline: !0,
          downloadEnable: !0,
          duration: 800,
          direction: _0xb07ax3['DIRECTION']['LTR'],
          pageMode: _0xb07ax3['PAGE_MODE']['AUTO'],
          singlePageMode: _0xb07ax3['SINGLE_PAGE_MODE']['AUTO'],
          backgroundColor: '#fff',
          forceFit: !0,
          transparent: !1,
          hard: 'none',
          openPage: 1,
          annotationClass: '',
          autoPlay: !0,
          autoPlayDuration: 3e3,
          autoPlayStart: !1,
          maxTextureSize: 1600,
          minTextureSize: 256,
          rangeChunkSize: 524288,
          icons: {
              altnext: 'ti-angle-right',
              altprev: 'ti-angle-right',
              next: 'fa fa-chevron-right',
              prev: 'fa fa-chevron-left',
              end: 'ti-angle-double-right',
              start: 'ti-angle-double-left',
              share: 'fa fa-share',
              help: 'ti-help-alt',
              more: 'ti-more-alt',
              download: 'fa fa-file-ppdff-o',
              zoomin: 'ti-zoom-in',
              zoomout: 'ti-zoom-out',
              fullscreen: 'fa fa-arrows-alt',
              fitscreen: 'ti-arrows-corner',
              thumbnail: 'ti-layout-grid2',
              outline: 'ti-menu-alt',
              close: 'ti-close',
              doublepage: 'ti-book',
              singlepage: 'ti-file',
              sound: 'ti-volume',
              facebook: 'ti-facebook',
              google: 'ti-linkedin',
              twitter: 'ti-twitter-alt',
              mail: 'ti-email',
              play: 'ti-control-play',
              pause: 'ti-control-pause'
          },
          text: {
              toggleSound: 'Sound',
              toggleThumbnails: 'Thumbnails',
              toggleOutline: 'Contents',
              previousPage: 'Previous Page',
              nextPage: 'Next Page',
              toggleFullscreen: 'Fullscreen',
              zoomIn: 'Zoom In',
              zoomOut: 'Zoom Out',
              downloadPDFFile: 'Download PDF',
              gotoFirstPage: 'First Page',
              gotoLastPage: 'Last Page',
              play: 'AutoPlay On',
              pause: 'AutoPlay Off',
              share: 'Share'
          },
          allControls: 'startPage,altPrev,pageNumber,altNext,endPage,play,outline,thumbnail,zoomIn,zoomOut,fullScreen,share,download,sound',
          moreControls: '',
          hideControls: '',
          controlsPosition: _0xb07ax3['CONTROLSPOSITION']['BOTTOM'],
          paddingTop: 15,
          paddingLeft: 15,
          paddingRight: 15,
          paddingBottom: -10,
          scrollWheel: !0,
          onCreate: function(_0xb07ax3) {},
          onCreateUI: function(_0xb07ax3) {},
          onFlip: function(_0xb07ax3) {},
          beforeFlip: function(_0xb07ax3) {},
          onReady: function(_0xb07ax3) {},
          zoomRatio: 1.5,
          pageSize: _0xb07ax3['PAGE_SIZE']['AUTO'],
          pdfjsSrc: 'js/libs/pdf.min.js',
          pdfjsCompatibilitySrc: 'js/libs/compatibility.js',
          pdfjsWorkerSrc: 'js/libs/pdf.worker.min.js',
          threejsSrc: 'js/libs/three.min.js',
          utilsSrc: 'js/libs/utils.min.js',
          soundFile: 'sound/turn.mp3',
          imagesLocation: 'images',
          imageResourcesPath: 'images/pdfjs/',
          cMapUrl: 'cmaps/',
          enableDebugLog: !1,
          canvasToBlob: !1,
          enableAnnotation: !0,
          pdfRenderQuality: 0.9,
          textureLoadFallback: 'blank',
          stiffness: 3,
          backgroundImage: 'pflip/background.jpg',
          pageRatio: null,
          pixelRatio: window['devicePixelRatio'] || 1,
          thumbElement: 'div',
          spotLightIntensity: 0.22,
          ambientLightColor: '#fff',
          ambientLightIntensity: 0.8,
          shadowOpacity: 0.08
      }, _0xb07axa = 'WebKitCSSMatrix'in window || document['body'] && 'MozPerspective'in document['body']['style'], _0xb07axb = 'onmousedown'in window, _0xb07axc = (window,
      navigator['userAgent']), _0xb07axd = _0xb07ax3['utils'] = {
          drag: {
              left: 0,
              right: 1,
              none: -1
          },
          mouseEvents: _0xb07axb ? {
              type: 'mouse',
              start: 'mousedown',
              move: 'mousemove',
              end: 'mouseup'
          } : {
              type: 'touch',
              start: 'touchstart',
              move: 'touchmove',
              end: 'touchend'
          },
          html: {
              div: '<div/>',
              img: '<img/>',
              a: '<a>',
              input: '<input type=\'text\'/>'
          },
          toRad: function(_0xb07ax3) {
              return _0xb07ax3 * Math['PI'] / 180
          },
          isset: function(_0xb07ax3, _0xb07ax4) {
              return null == _0xb07ax3 ? _0xb07ax4 : _0xb07ax3
          },
          isnull: function(_0xb07ax3) {
              return null == _0xb07ax3 || null == _0xb07ax3
          },
          toDeg: function(_0xb07ax3) {
              return 180 * _0xb07ax3 / Math['PI']
          },
          transition: function(_0xb07ax3, _0xb07ax4) {
              return _0xb07ax3 ? _0xb07ax4 / 1e3 + 's ease-out' : '0s none'
          },
          display: function(_0xb07ax3) {
              return _0xb07ax3 ? 'block' : 'none'
          },
          resetTranslate: function() {
              return _0xb07ax15(0, 0)
          },
          translateStr: function(_0xb07ax3, _0xb07ax4) {
              return _0xb07axa ? ' translate3d(' + _0xb07ax3 + 'px,' + _0xb07ax4 + 'px, 0px) ' : ' translate(' + _0xb07ax3 + 'px, ' + _0xb07ax4 + 'px) '
          },
          httpsCorrection: function(_0xb07ax3) {
              var _0xb07ax4 = window['location'];
              return _0xb07ax4['href']['indexOf']('https://') > -1 && _0xb07ax3['indexOf'](_0xb07ax4['hostname']) > -1 && (_0xb07ax3 = _0xb07ax3['replace']('http://', 'https://')),
              _0xb07ax3
          },
          resetBoxShadow: function() {
              return 'rgba(0, 0, 0, 0) 0px 0px 20px'
          },
          rotateStr: function(_0xb07ax3) {
              return ' rotateZ(' + _0xb07ax3 + 'deg) '
          },
          bg: function(_0xb07ax3) {
              return '#fff' + _0xb07ax17(_0xb07ax3)
          },
          bgImage: function(_0xb07ax3) {
              return null == _0xb07ax3 || 'blank' == _0xb07ax3 ? '' : ' url(' + _0xb07ax3 + ')'
          },
          src: function(_0xb07ax3) {
              return null != _0xb07ax3 ? '' + _0xb07ax3 : ''
          },
          limitAt: function(_0xb07ax3, _0xb07ax4, _0xb07ax5) {
              return _0xb07ax3 < _0xb07ax4 ? _0xb07ax4 : _0xb07ax3 > _0xb07ax5 ? _0xb07ax5 : _0xb07ax3
          },
          distOrigin: function(_0xb07ax3, _0xb07ax4) {
              return Math['sqrt'](Math['pow'](_0xb07ax3, 2) + Math['pow'](_0xb07ax4, 2))
          },
          distPoints: function(_0xb07ax3, _0xb07ax4, _0xb07ax5, _0xb07ax6) {
              return Math['sqrt'](Math['pow'](_0xb07ax5 - _0xb07ax3, 2) + Math['pow'](_0xb07ax6 - _0xb07ax4, 2))
          },
          calculateScale: function(_0xb07ax3, _0xb07ax4) {
              var _0xb07ax5 = _0xb07ax1a(_0xb07ax3[0]['x'], _0xb07ax3[0]['y'], _0xb07ax3[1]['x'], _0xb07ax3[1]['y']);
              return _0xb07ax1a(_0xb07ax4[0]['x'], _0xb07ax4[0]['y'], _0xb07ax4[1]['x'], _0xb07ax4[1]['y']) / _0xb07ax5
          },
          getVectorAvg: function(_0xb07ax3) {
              return {
                  x: _0xb07ax3['map'](function(_0xb07ax3) {
                      return _0xb07ax3['x']
                  })['reduce'](_0xb07axd['sum']) / _0xb07ax3['length'],
                  y: _0xb07ax3['map'](function(_0xb07ax3) {
                      return _0xb07ax3['y']
                  })['reduce'](_0xb07axd['sum']) / _0xb07ax3['length']
              }
          },
          sum: function(_0xb07ax3, _0xb07ax4) {
              return _0xb07ax3 + _0xb07ax4
          },
          getTouches: function(_0xb07ax3, _0xb07ax4) {
              return _0xb07ax4 = _0xb07ax4 || {
                  left: 0,
                  top: 0
              },
              Array['prototype']['slice']['call'](_0xb07ax3['touches'])['map'](function(_0xb07ax3) {
                  return {
                      x: _0xb07ax3['pageX'] - _0xb07ax4['left'],
                      y: _0xb07ax3['pageY'] - _0xb07ax4['top']
                  }
              })
          },
          angleByDistance: function(_0xb07ax3, _0xb07ax4) {
              var _0xb07ax5 = _0xb07ax4 / 2
                , _0xb07ax6 = _0xb07ax18(_0xb07ax3, 0, _0xb07ax4);
              return _0xb07ax6 < _0xb07ax5 ? _0xb07ax14(Math['asin'](_0xb07ax6 / _0xb07ax5)) : 90 + _0xb07ax14(Math['asin']((_0xb07ax6 - _0xb07ax5) / _0xb07ax5))
          },
          log: function(_0xb07ax3) {
              1 == _0xb07ax9['enableDebugLog'] && window['console'] && console['log'](_0xb07ax3)
          },
          lowerPowerOfTwo: function(_0xb07ax3) {
              return Math['pow'](2, Math['floor'](Math['log'](_0xb07ax3) / Math['LN2']))
          },
          nearestPowerOfTwo: function(_0xb07ax3, _0xb07ax4) {
              return Math['min'](_0xb07ax4 || 2048, Math['pow'](2, Math['ceil'](Math['log'](_0xb07ax3) / Math['LN2'])))
          },
          zoomStops: function(_0xb07ax3, _0xb07ax4, _0xb07ax5, _0xb07ax6, _0xb07ax7) {
              null == _0xb07ax6 && (_0xb07ax6 = 256),
              null == _0xb07ax7 && (_0xb07ax7 = 2048);
              var _0xb07ax8 = Math['log'](_0xb07ax3 / _0xb07ax6) / Math['log'](_0xb07ax4);
              return _0xb07ax6 * Math['pow'](_0xb07ax4, null == _0xb07ax5 ? Math['round'](_0xb07ax8) : 1 == _0xb07ax5 ? Math['ceil'](_0xb07ax8) : Math['floor'](_0xb07ax8))
          },
          extendOptions: function(_0xb07ax3, _0xb07ax5) {
              return _0xb07ax4['extend'](!0, {}, _0xb07ax3, _0xb07ax5)
          },
          getFullscreenElement: function() {
              return document['fullscreenElement'] || document['mozFullScreenElement'] || document['webkitFullscreenElement'] || document['msFullscreenElement']
          },
          hasFullscreenEnabled: function() {
              return document['fullscreenEnabled'] || document['mozFullScreenEnabled'] || document['webkitFullscreenEnabled'] || document['msFullscreenEnabled']
          },
          getBasePage: function(_0xb07ax3) {
              return 2 * Math['floor'](_0xb07ax3 / 2)
          },
          loadResources: function(_0xb07ax3, _0xb07ax4, _0xb07ax5) {
              var _0xb07ax6 = document
                , _0xb07ax7 = _0xb07ax6['createElement'](_0xb07ax3)
                , _0xb07ax8 = _0xb07ax6['getElementsByTagName'](_0xb07ax3)[0];
              _0xb07ax7['async'] = !0,
              _0xb07ax5 && _0xb07ax7['addEventListener']('load', function(_0xb07ax3) {
                  _0xb07ax5(null, _0xb07ax3)
              }, !1),
              _0xb07ax7['src'] = _0xb07ax4,
              _0xb07ax8['parentNode']['insertBefore'](_0xb07ax7, _0xb07ax8)
          },
          getScript: function(_0xb07ax3, _0xb07ax4, _0xb07ax5) {
              var _0xb07ax6 = document['createElement']('script')
                , _0xb07ax7 = document['body']['getElementsByTagName']('script')[0];

              function _0xb07ax8(_0xb07ax3, _0xb07ax7) {
                  null != _0xb07ax6 && (_0xb07ax7 || !_0xb07ax6['readyState'] || /loaded|complete/['test'](_0xb07ax6['readyState'])) && (_0xb07ax6['onload'] = _0xb07ax6['onreadystatechange'] = null,
                  _0xb07ax6 = null,
                  _0xb07ax6 = null,
                  _0xb07ax7 || (_0xb07ax4 && _0xb07ax4(),
                  _0xb07ax4 = null,
                  _0xb07ax5 = null))
              }
              _0xb07ax6['async'] = 1,
              _0xb07ax6['setAttribute']('data-cfasync', !1),
              null != _0xb07ax7 ? (_0xb07ax7['parentNode']['insertBefore'](_0xb07ax6, _0xb07ax7),
              _0xb07ax7 = null) : document['body']['appendChild'](_0xb07ax6),
              _0xb07ax6['addEventListener']('load', _0xb07ax8, !1),
              _0xb07ax6['addEventListener']('readystatechange', _0xb07ax8, !1),
              _0xb07ax6['addEventListener']('complete', _0xb07ax8, !1),
              _0xb07ax5 && _0xb07ax6['addEventListener']('error', _0xb07ax5, !1),
              _0xb07ax6['src'] = _0xb07ax3 + ('MS' == _0xb07ax22['dom'] ? '?' + Math['random'](1) : '')
          },
          isHardPage: function(_0xb07ax3, _0xb07ax4, _0xb07ax5, _0xb07ax6) {
              if (null != _0xb07ax3) {
                  if ('cover' == _0xb07ax3) {
                      return 0 == _0xb07ax4 || _0xb07ax6 && 1 == _0xb07ax4 || _0xb07ax4 == Math['floor'](_0xb07ax5 / (_0xb07ax6 ? 1 : 2)) - (_0xb07ax6 ? 0 : 1)
                  }
                  ;if ('all' == _0xb07ax3) {
                      return !0
                  }
                  ;var _0xb07ax7 = (',' + _0xb07ax3 + ',')['indexOf'](',' + (2 * _0xb07ax4 + 1) + ',') > -1
                    , _0xb07ax8 = (',' + _0xb07ax3 + ',')['indexOf'](',' + (2 * _0xb07ax4 + 2) + ',') > -1;
                  return _0xb07ax7 || _0xb07ax8
              }
              ;return !1
          },
          fixMouseEvent: function(_0xb07ax3) {
              if (_0xb07ax3) {
                  var _0xb07ax5 = _0xb07ax3['originalEvent'] || _0xb07ax3;
                  if (_0xb07ax5['changedTouches'] && _0xb07ax5['changedTouches']['length'] > 0) {
                      var _0xb07ax6 = _0xb07ax4['event']['fix'](_0xb07ax3)
                        , _0xb07ax7 = _0xb07ax5['changedTouches'][0];
                      return _0xb07ax6['clientX'] = _0xb07ax7['clientX'],
                      _0xb07ax6['clientY'] = _0xb07ax7['clientY'],
                      _0xb07ax6['pageX'] = _0xb07ax7['pageX'],
                      _0xb07ax6['touches'] = _0xb07ax5['touches'],
                      _0xb07ax6['pageY'] = _0xb07ax7['pageY'],
                      _0xb07ax6['movementX'] = _0xb07ax7['movementX'],
                      _0xb07ax6['movementY'] = _0xb07ax7['movementY'],
                      _0xb07ax6
                  }
                  ;return _0xb07ax3
              }
              ;return _0xb07ax3
          },
          hasWebgl: function() {
              try {
                  var _0xb07ax3 = document['createElement']('canvas');
                  return !(!window['WebGLRenderingContext'] || !_0xb07ax3['getContext']('webgl') && !_0xb07ax3['getContext']('experimental-webgl'))
              } catch (_0xb07ax3) {
                  return !1
              }
          }(),
          isBookletMode: function(_0xb07ax4) {
              return _0xb07ax4['pageMode'] == _0xb07ax3['PAGE_MODE']['SINGLE'] && _0xb07ax4['singlePageMode'] == _0xb07ax3['SINGLE_PAGE_MODE']['BOOKLET']
          },
          isRTLMode: function(_0xb07ax4) {
              return _0xb07ax4['direction'] == _0xb07ax3['DIRECTION']['RTL']
          },
          isMobile: (_0xb07ax8 = !1,
          _0xb07ax7 = _0xb07axc || navigator['vendor'] || window['opera'],
          (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i['test'](_0xb07ax7) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i['test'](_0xb07ax7['substr'](0, 4))) && (_0xb07ax8 = !0),
          _0xb07ax8),
          isIOS: /(iPad|iPhone|iPod)/g['test'](_0xb07axc),
          isSafari: /constructor/i['test'](window.HTMLElement) || '[object SafariRemoteNotification]' === (!window['safari'] || safari['pushNotification']).toString(),
          prefix: (_0xb07ax5 = window['getComputedStyle'](document['documentElement'], ''),
          _0xb07ax6 = Array['prototype']['slice']['call'](_0xb07ax5)['join']('')['match'](/-(moz|webkit|ms)-/)[1],
          {
              dom: 'WebKit|Moz|MS'['match'](new RegExp('(' + _0xb07ax6 + ')','i'))[1],
              lowercase: _0xb07ax6,
              css: '-' + _0xb07ax6 + '-',
              js: _0xb07ax6[0]['toUpperCase']() + _0xb07ax6['substr'](1)
          }),
          __extends: function(_0xb07ax3, _0xb07ax4) {
              for (var _0xb07ax5 in _0xb07ax4) {
                  _0xb07ax4['hasOwnProperty'](_0xb07ax5) && (_0xb07ax3[_0xb07ax5] = _0xb07ax4[_0xb07ax5])
              }
              ;
              function _0xb07ax6() {
                  this['constructor'] = _0xb07ax3
              }
              return _0xb07ax6['prototype'] = _0xb07ax4['prototype'],
              _0xb07ax3['prototype'] = new _0xb07ax6,
              _0xb07ax3['__super'] = _0xb07ax4['prototype'],
              _0xb07ax3
          }
      }, _0xb07axe = _0xb07ax3['SOURCE_TYPE'], _0xb07axf = (_0xb07ax3['DISPLAY_TYPE'],
      _0xb07axd['drag']), _0xb07ax10 = _0xb07axd['mouseEvents'], _0xb07ax11 = _0xb07axd['html'], _0xb07ax12 = _0xb07axd['isset'], _0xb07ax13 = (_0xb07axd['isnull'],
      _0xb07axd['toRad']), _0xb07ax14 = _0xb07axd['toDeg'], _0xb07ax15 = (_0xb07axd['transition'],
      _0xb07axd['translateStr']), _0xb07ax16 = (_0xb07axd['resetBoxShadow'],
      _0xb07axd['rotateStr']), _0xb07ax17 = (_0xb07axd['bg'],
      _0xb07axd['bgImage']), _0xb07ax18 = (_0xb07axd['src'],
      _0xb07axd['limitAt']), _0xb07ax19 = _0xb07axd['distOrigin'], _0xb07ax1a = _0xb07axd['distPoints'], _0xb07ax1b = _0xb07axd['angleByDistance'], _0xb07ax1c = _0xb07axd['log'], _0xb07ax1d = _0xb07axd['nearestPowerOfTwo'], _0xb07ax1e = _0xb07axd['extendOptions'], _0xb07ax1f = _0xb07axd['getBasePage'], _0xb07ax20 = _0xb07axd['getScript'], _0xb07ax21 = _0xb07axd['fixMouseEvent'], _0xb07ax22 = _0xb07axd['prefix'], _0xb07ax23 = _0xb07axd['isBookletMode'], _0xb07ax24 = _0xb07axd['isRTLMode'], _0xb07ax25 = _0xb07axd['isMobile'], _0xb07ax26 = _0xb07axd['hasWebgl'], _0xb07ax27 = _0xb07axd['isSafari'], _0xb07ax28 = _0xb07axd['isIOS'], _0xb07ax29 = _0xb07axd['__extends'];
      !function() {
          if (window['CanvasPixelArray']) {
              'function' != typeof window['CanvasPixelArray']['prototype']['set'] && (window['CanvasPixelArray']['prototype']['set'] = function(_0xb07ax3) {
                  for (var _0xb07ax4 = 0, _0xb07ax5 = this['length']; _0xb07ax4 < _0xb07ax5; _0xb07ax4++) {
                      this[_0xb07ax4] = _0xb07ax3[_0xb07ax4]
                  }
              }
              )
          } else {
              var _0xb07ax3, _0xb07ax4 = !1;
              if (_0xb07ax27 && (_0xb07ax4 = (_0xb07ax3 = _0xb07axc['match'](/Version\/([0-9]+)\.([0-9]+)\.([0-9]+) Safari\//)) && parseInt(_0xb07ax3[1]) < 6),
              _0xb07ax4) {
                  var _0xb07ax5 = window['CanvasRenderingContext2D']['prototype']
                    , _0xb07ax6 = _0xb07ax5['createImageData'];
                  _0xb07ax5['createImageData'] = function(_0xb07ax3, _0xb07ax4) {
                      var _0xb07ax5 = _0xb07ax6['call'](this, _0xb07ax3, _0xb07ax4);
                      return _0xb07ax5['data']['set'] = function(_0xb07ax3) {
                          for (var _0xb07ax4 = 0, _0xb07ax5 = this['length']; _0xb07ax4 < _0xb07ax5; _0xb07ax4++) {
                              this[_0xb07ax4] = _0xb07ax3[_0xb07ax4]
                          }
                      }
                      ,
                      _0xb07ax5
                  }
                  ,
                  _0xb07ax5 = null
              }
          }
      }(),
      function() {
          'requestAnimationFrame'in window || (window['requestAnimationFrame'] = window['mozRequestAnimationFrame'] || window['webkitRequestAnimationFrame'] || function(_0xb07ax3) {
              window['setTimeout'](_0xb07ax3, 20)
          }
          )
      }(),
      function() {
          if ('undefined' != typeof Uint8Array) {
              return void (0) === Uint8Array['prototype']['subarray'] && (Uint8Array['prototype']['subarray'] = function(_0xb07ax3, _0xb07ax4) {
                  return new Uint8Array(this['slice'](_0xb07ax3, _0xb07ax4))
              }
              ,
              Float32Array['prototype']['subarray'] = function(_0xb07ax3, _0xb07ax4) {
                  return new Float32Array(this['slice'](_0xb07ax3, _0xb07ax4))
              }
              ),
              void (('undefined' == typeof Float64Array && (window['Float64Array'] = Float32Array)))
          }
          ;
          function _0xb07ax3(_0xb07ax3, _0xb07ax4) {
              return new _0xb07ax5(this['slice'](_0xb07ax3, _0xb07ax4))
          }

          function _0xb07ax4(_0xb07ax3, _0xb07ax4) {
              arguments['length'] < 2 && (_0xb07ax4 = 0);
              for (var _0xb07ax5 = 0, _0xb07ax6 = _0xb07ax3['length']; _0xb07ax5 < _0xb07ax6; ++_0xb07ax5,
              ++_0xb07ax4) {
                  this[_0xb07ax4] = 255 & _0xb07ax3[_0xb07ax5]
              }
          }

          function _0xb07ax5(_0xb07ax5) {
              var _0xb07ax6, _0xb07ax7, _0xb07ax8;
              if ('number' == typeof _0xb07ax5) {
                  for (_0xb07ax6 = [],
                  _0xb07ax7 = 0; _0xb07ax7 < _0xb07ax5; ++_0xb07ax7) {
                      _0xb07ax6[_0xb07ax7] = 0
                  }
              } else {
                  if ('slice'in _0xb07ax5) {
                      _0xb07ax6 = _0xb07ax5['slice'](0)
                  } else {
                      for (_0xb07ax6 = [],
                      _0xb07ax7 = 0,
                      _0xb07ax8 = _0xb07ax5['length']; _0xb07ax7 < _0xb07ax8; ++_0xb07ax7) {
                          _0xb07ax6[_0xb07ax7] = _0xb07ax5[_0xb07ax7]
                      }
                  }
              }
              ;return _0xb07ax6['subarray'] = _0xb07ax3,
              _0xb07ax6['buffer'] = _0xb07ax6,
              _0xb07ax6['byteLength'] = _0xb07ax6['length'],
              _0xb07ax6['set'] = _0xb07ax4,
              'object' == typeof _0xb07ax5 && _0xb07ax5['buffer'] && (_0xb07ax6['buffer'] = _0xb07ax5['buffer']),
              _0xb07ax6
          }
          window['Uint8Array'] = _0xb07ax5,
          window['Int8Array'] = _0xb07ax5,
          window['Uint32Array'] = _0xb07ax5,
          window['Int32Array'] = _0xb07ax5,
          window['Uint16Array'] = _0xb07ax5,
          window['Float32Array'] = _0xb07ax5,
          window['Float64Array'] = _0xb07ax5
      }();
      var _0xb07ax2a = function(_0xb07ax5, _0xb07ax6) {
          var _0xb07ax7 = 'pdff-ui'
            , _0xb07ax8 = 'pdff-ui-wrapper'
            , _0xb07ax9 = _0xb07ax7 + '-btn'
            , _0xb07axa = _0xb07ax6['ui'] = _0xb07ax4(_0xb07ax11['div'], {
              class: _0xb07ax7
          })
            , _0xb07axb = _0xb07ax6['options'];
          _0xb07axa['dispose'] = function() {
              _0xb07ax5['find']('.' + _0xb07ax9)['each'](function() {
                  _0xb07ax4(this)['off']()
              }),
              _0xb07ax17['off'](),
              _0xb07axe['off'](),
              _0xb07axf['off'](),
              _0xb07ax10['off'](),
              _0xb07ax12['off'](),
              _0xb07ax13['off'](),
              _0xb07ax14['off'](),
              _0xb07ax15['off'](),
              _0xb07ax18['off'](),
              _0xb07ax19['off'](),
              _0xb07ax1e['off'](),
              _0xb07ax1f['off'](),
              _0xb07ax21['off'](),
              _0xb07ax22['off'](),
              _0xb07ax23['off'](),
              _0xb07ax24['off'](),
              _0xb07ax25['off'](),
              _0xb07ax26['off'](),
              _0xb07ax27['off'](),
              _0xb07ax28['off'](),
              _0xb07ax20['remove'](),
              _0xb07ax16['remove'](),
              _0xb07axf['remove'](),
              _0xb07axe['remove'](),
              _0xb07ax12['remove'](),
              _0xb07axa['shareBox'] && (_0xb07axa['shareBox']['dispose'] && _0xb07axa['shareBox']['dispose'](),
              _0xb07axa['shareBox'] = null),
              document['removeEventListener']('keyup', _0xb07ax35, !1),
              window['removeEventListener']('click', _0xb07ax1a, !1),
              _0xb07axa['update'] = null,
              _0xb07ax6 = null
          }
          ;
          var _0xb07axc = function(_0xb07ax3) {
              return isNaN(_0xb07ax3) ? _0xb07ax3 = _0xb07ax6['target']['_activePage'] : _0xb07ax3 < 1 ? _0xb07ax3 = 1 : _0xb07ax3 > _0xb07ax6['target']['pageCount'] && (_0xb07ax3 = _0xb07ax6['target']['pageCount']),
              _0xb07ax3
          }
            , _0xb07axe = _0xb07axa['next'] = _0xb07ax4(_0xb07ax11['div'], {
              class: _0xb07ax9 + ' ' + _0xb07ax7 + '-next ' + _0xb07axb['icons']['next'],
              title: _0xb07axb['text']['nextPage'],
              html: '<span>' + _0xb07axb['text']['nextPage'] + '</span>'
          })['on']('click', function() {
              _0xb07ax6['next']()
          })
            , _0xb07axf = _0xb07axa['prev'] = _0xb07ax4(_0xb07ax11['div'], {
              class: _0xb07ax9 + ' ' + _0xb07ax7 + '-prev ' + _0xb07axb['icons']['prev'],
              title: _0xb07axb['text']['previousPage'],
              html: '<span>' + _0xb07axb['text']['previousPage'] + '</span>'
          })['on']('click', function() {
              _0xb07ax6['prev']()
          })
            , _0xb07ax10 = _0xb07ax4(_0xb07ax11['div'], {
              class: _0xb07ax9 + ' ' + _0xb07ax7 + '-play ' + _0xb07axb['icons']['play'],
              title: _0xb07axb['text']['play'],
              html: '<span>' + _0xb07axb['text']['play'] + '</span>'
          })['on']('click', function() {
              var _0xb07ax3 = _0xb07ax4(this);
              _0xb07ax6['setAutoPlay'](!_0xb07ax3['hasClass'](_0xb07axb['icons']['pause']))
          });
          1 == _0xb07axb['autoPlay'] && (_0xb07axa['play'] = _0xb07ax10,
          _0xb07ax6['setAutoPlay'](_0xb07axb['autoPlayStart']));
          var _0xb07ax12 = _0xb07ax4(_0xb07ax11['div'], {
              class: _0xb07ax8 + ' ' + _0xb07ax7 + '-zoom'
          })
            , _0xb07ax13 = _0xb07axa['zoomIn'] = _0xb07ax4(_0xb07ax11['div'], {
              class: _0xb07ax9 + ' ' + _0xb07ax7 + '-zoomin ' + _0xb07axb['icons']['zoomin'],
              title: _0xb07axb['text']['zoomIn'],
              html: '<span>' + _0xb07axb['text']['zoomIn'] + '</span>'
          })['on']('click', function() {
              _0xb07ax6['zoom'](1),
              _0xb07axa['update'](),
              _0xb07ax6['target']['startPoint'] && _0xb07ax6['target']['pan'] && _0xb07ax6['target']['pan'](_0xb07ax6['target']['startPoint'])
          })
            , _0xb07ax14 = _0xb07axa['zoomOut'] = _0xb07ax4(_0xb07ax11['div'], {
              class: _0xb07ax9 + ' ' + _0xb07ax7 + '-zoomout ' + _0xb07axb['icons']['zoomout'],
              title: _0xb07axb['text']['zoomOut'],
              html: '<span>' + _0xb07axb['text']['zoomOut'] + '</span>'
          })['on']('click', function() {
              _0xb07ax6['zoom'](-1),
              _0xb07axa['update'](),
              _0xb07ax6['target']['startPoint'] && _0xb07ax6['target']['pan'] && _0xb07ax6['target']['pan'](_0xb07ax6['target']['startPoint'])
          });
          _0xb07ax12['append'](_0xb07ax13)['append'](_0xb07ax14);
          var _0xb07ax15 = _0xb07axa['pageNumber'] = _0xb07ax4(_0xb07ax11['div'], {
              class: _0xb07ax9 + ' ' + _0xb07ax7 + '-page'
          })['on']('change', function() {
              var _0xb07ax3 = parseInt(_0xb07axa['pageInput']['val'](), 10);
              _0xb07ax3 = _0xb07axc(_0xb07ax3),
              _0xb07ax6['gotoPage'](_0xb07ax3)
          })['on']('keyup', function(_0xb07ax3) {
              if (13 == _0xb07ax3['keyCode']) {
                  var _0xb07ax4 = parseInt(_0xb07axa['pageInput']['val'](), 10);
                  (_0xb07ax4 = _0xb07axc(_0xb07ax4)) !== _0xb07axc(_0xb07ax6['target']['_activePage'] || _0xb07ax6['_activePage']) && _0xb07ax6['gotoPage'](_0xb07ax4)
              }
          });
          _0xb07axa['pageInput'] = _0xb07ax4('<input id="df_book_page_number" type="text"/>')['appendTo'](_0xb07ax15),
          _0xb07axa['pageLabel'] = _0xb07ax4('<label for="df_book_page_number"/>')['appendTo'](_0xb07ax15);
          var _0xb07ax16 = _0xb07ax4(_0xb07ax11['div'], {
              class: _0xb07ax8 + ' ' + _0xb07ax7 + '-size'
          })
            , _0xb07ax17 = _0xb07ax4(_0xb07ax11['div'], {
              class: _0xb07ax9 + ' ' + _0xb07ax7 + '-help ' + _0xb07axb['icons']['help'],
              title: _0xb07axb['text']['toggleHelp'],
              html: '<span>' + _0xb07axb['text']['toggleHelp'] + '</span>'
          })['on']('click', function() {})
            , _0xb07ax18 = _0xb07axa['sound'] = _0xb07ax4(_0xb07ax11['div'], {
              class: _0xb07ax9 + ' ' + _0xb07ax7 + '-sound ' + _0xb07axb['icons']['sound'],
              title: _0xb07axb['text']['toggleSound'],
              html: '<span>' + _0xb07axb['text']['toggleSound'] + '</span>'
          })['on']('click', function() {
              _0xb07axb['enableSound'] = !_0xb07axb['enableSound'],
              _0xb07axa['updateSound']()
          });
          _0xb07axa['updateSound'] = function() {
              0 == _0xb07axb['enableSound'] || 'false' == _0xb07axb['enableSound'] ? _0xb07ax18['addClass']('disabled') : _0xb07ax18['removeClass']('disabled')
          }
          ,
          _0xb07axa['updateSound']();
          var _0xb07ax19 = _0xb07axa['more'] = _0xb07ax4(_0xb07ax11['div'], {
              class: _0xb07ax9 + ' ' + _0xb07ax7 + '-more ' + _0xb07axb['icons']['more']
          })['on']('click', function(_0xb07ax3) {
              _0xb07ax19['hasClass']('pdff-active') || (_0xb07ax4(this)['addClass']('pdff-active'),
              _0xb07ax3['stopPropagation']())
          });

          function _0xb07ax1a(_0xb07ax3) {
              _0xb07ax19['removeClass']('pdff-active')
          }
          window['addEventListener']('click', _0xb07ax1a, !1);
          var _0xb07ax1b = _0xb07ax4(_0xb07ax11['div'], {
              class: 'more-container'
          });
          if (_0xb07ax19['append'](_0xb07ax1b),
          'string' == typeof _0xb07axb['source'] && 1 == _0xb07axb['downloadEnable']) {
              var _0xb07ax1d = _0xb07ax9 + ' ' + _0xb07ax7 + '-download ' + _0xb07axb['icons']['download'];
              (_0xb07axa['download'] = _0xb07ax4('<a download target="_blank" class="' + _0xb07ax1d + '"><span>' + _0xb07axb['text']['downloadPDFFile'] + '</span></a>'))['attr']('href', _0xb07axb['source'])['attr']('title', _0xb07axb['text']['downloadPDFFile'])
          }
          ;_0xb07axd['hasFullscreenEnabled']() || _0xb07ax5['addClass']('pdff-custom-fullscreen'),
          _0xb07axa['switchFullscreen'] = function() {
              _0xb07axd['getFullscreenElement']();
              var _0xb07ax3 = _0xb07ax6['container'][0];
              1 != _0xb07axa['isFullscreen'] ? (_0xb07ax6['container']['addClass']('pdff-fullscreen'),
              _0xb07ax3['requestFullscreen'] ? _0xb07ax3['requestFullscreen']() : _0xb07ax3['msRequestFullscreen'] ? _0xb07ax3['msRequestFullscreen']() : _0xb07ax3['mozRequestFullScreen'] ? _0xb07ax3['mozRequestFullScreen']() : _0xb07ax3['webkitRequestFullscreen'] && _0xb07ax3['webkitRequestFullscreen'](),
              _0xb07axa['isFullscreen'] = !0) : (_0xb07ax6['container']['removeClass']('pdff-fullscreen'),
              _0xb07axa['isFullscreen'] = !1,
              document['exitFullscreen'] ? document['exitFullscreen']() : document['msExitFullscreen'] ? document['msExitFullscreen']() : document['mozCancelFullScreen'] ? document['mozCancelFullScreen']() : document['webkitExitFullscreen'] && document['webkitExitFullscreen']()),
              _0xb07axd['hasFullscreenEnabled']() || setTimeout(function() {
                  _0xb07ax6['resize']()
              }, 50)
          }
          ;
          var _0xb07ax1e = _0xb07axa['fullScreen'] = _0xb07ax4(_0xb07ax11['div'], {
              class: _0xb07ax9 + ' ' + _0xb07ax7 + '-fullscreen ' + _0xb07axb['icons']['fullscreen'],
              title: _0xb07axb['text']['toggleFullscreen'],
              html: '<span>' + _0xb07axb['text']['toggleFullscreen'] + '</span>'
          })['on']('click', _0xb07axa['switchFullscreen'])
            , _0xb07ax1f = _0xb07axa['fit'] = _0xb07ax4(_0xb07ax11['div'], {
              class: _0xb07ax9 + ' ' + _0xb07ax7 + '-fit ' + _0xb07axb['icons']['fitscreen']
          })['on']('click', function() {
              _0xb07ax4(this)['toggleClass']('pdff-button-fit-active')
          });
          _0xb07ax16['append'](_0xb07ax1e);
          var _0xb07ax20 = _0xb07ax4(_0xb07ax11['div'], {
              class: _0xb07ax8 + ' ' + _0xb07ax7 + '-controls'
          })
            , _0xb07ax21 = (_0xb07axa['shareBox'] = new _0xb07ax3.Share(_0xb07ax5,_0xb07axb),
          _0xb07axa['share'] = _0xb07ax4(_0xb07ax11['div'], {
              class: _0xb07ax9 + ' ' + _0xb07ax7 + '-share ' + _0xb07axb['icons']['share'],
              title: _0xb07axb['text']['share'],
              html: '<span>' + _0xb07axb['text']['share'] + '</span>'
          })['on']('click', function(_0xb07ax3) {
              1 == _0xb07axa['shareBox']['isOpen'] ? _0xb07axa['shareBox']['close']() : (_0xb07axa['shareBox']['update'](_0xb07ax6['getURLHash']()),
              _0xb07axa['shareBox']['show']())
          }))
            , _0xb07ax22 = _0xb07axa['startPage'] = _0xb07ax4(_0xb07ax11['div'], {
              class: _0xb07ax9 + ' ' + _0xb07ax7 + '-start ' + _0xb07axb['icons']['start'],
              title: _0xb07axb['text']['gotoFirstPage'],
              html: '<span>' + _0xb07axb['text']['gotoFirstPage'] + '</span>'
          })['on']('click', function() {
              _0xb07ax6['start']()
          })
            , _0xb07ax23 = _0xb07axa['endPage'] = _0xb07ax4(_0xb07ax11['div'], {
              class: _0xb07ax9 + ' ' + _0xb07ax7 + '-end ' + _0xb07axb['icons']['end'],
              title: _0xb07axb['text']['gotoLastPage'],
              html: '<span>' + _0xb07axb['text']['gotoLastPage'] + '</span>'
          })['on']('click', function() {
              _0xb07ax6['end']()
          })
            , _0xb07ax24 = _0xb07axa['pageMode'] = _0xb07ax4(_0xb07ax11['div'], {
              class: _0xb07ax9 + ' ' + _0xb07ax7 + '-pagemode ' + _0xb07axb['icons']['singlepage'],
              html: '<span>' + _0xb07axb['text']['singlePageMode'] + '</span>'
          })['on']('click', function() {
              var _0xb07ax3 = _0xb07ax4(this);
              _0xb07ax6['setPageMode'](!_0xb07ax3['hasClass'](_0xb07axb['icons']['doublepage']))
          });
          _0xb07ax6['setPageMode'](_0xb07ax6['target']['pageMode'] == _0xb07ax3['PAGE_MODE']['SINGLE']);
          for (var _0xb07ax25 = _0xb07axa['altPrev'] = _0xb07ax4(_0xb07ax11['div'], {
              class: _0xb07ax9 + ' ' + _0xb07ax7 + '-prev ' + _0xb07ax7 + '-alt ' + _0xb07axb['icons']['prev'],
              title: _0xb07axb['text']['previousPage'],
              html: '<span>' + _0xb07axb['text']['previousPage'] + '</span>'
          })['on']('click', function() {
              _0xb07ax6['prev']()
          }), _0xb07ax26 = _0xb07axa['altNext'] = _0xb07ax4(_0xb07ax11['div'], {
              class: _0xb07ax9 + ' ' + _0xb07ax7 + '-next ' + _0xb07ax7 + '-alt ' + _0xb07axb['icons']['next'],
              title: _0xb07axb['text']['nextPage'],
              html: '<span>' + _0xb07axb['text']['nextPage'] + '</span>'
          })['on']('click', function() {
              _0xb07ax6['next']()
          }), _0xb07ax27 = _0xb07axa['thumbnail'] = _0xb07ax4(_0xb07ax11['div'], {
              class: _0xb07ax9 + ' ' + _0xb07ax7 + '-thumbnail ' + _0xb07axb['icons']['thumbnail'],
              title: _0xb07axb['text']['toggleThumbnails'],
              html: '<span>' + _0xb07axb['text']['toggleThumbnails'] + '</span>'
          })['on']('click', function() {
              var _0xb07ax3 = _0xb07ax4(this);
              _0xb07ax6['target']['thumbContainer'] ? (_0xb07ax6['target']['thumbContainer']['toggleClass']('pdff-sidemenu-visible'),
              _0xb07ax3['toggleClass']('pdff-active')) : (_0xb07ax6['contentProvider']['initThumbs'](),
              _0xb07ax3['toggleClass']('pdff-active'));
              _0xb07ax3['hasClass']('pdff-active') && _0xb07ax3['siblings']('.pdff-active')['trigger']('click'),
              _0xb07axa['update'](!0)
          }), _0xb07ax28 = _0xb07axa['outline'] = _0xb07ax4(_0xb07ax11['div'], {
              class: _0xb07ax9 + ' ' + _0xb07ax7 + '-outline ' + _0xb07axb['icons']['outline'],
              title: _0xb07axb['text']['toggleOutline'],
              html: '<span>' + _0xb07axb['text']['toggleOutline'] + '</span>'
          })['on']('click', function() {
              var _0xb07ax3 = _0xb07ax4(this);
              if (_0xb07ax6['target']['outlineContainer']) {
                  var _0xb07ax5 = _0xb07ax6['target']['outlineContainer'];
                  _0xb07ax3['toggleClass']('pdff-active'),
                  _0xb07ax5['toggleClass']('pdff-sidemenu-visible'),
                  _0xb07ax3['hasClass']('pdff-active') && _0xb07ax3['siblings']('.pdff-active')['trigger']('click'),
                  _0xb07axa['update'](!0)
              }
          }), _0xb07ax29 = _0xb07axb['allControls']['replace'](/ /g, '')['split'](','), _0xb07ax2a = ',' + _0xb07axb['moreControls']['replace'](/ /g, '') + ',', _0xb07ax2b = ',' + _0xb07axb['hideControls']['replace'](/ /g, '') + ',', _0xb07ax2c = (_0xb07ax2a['split'](','),
          0); _0xb07ax2c < _0xb07ax29['length']; _0xb07ax2c++) {
              var _0xb07ax2d = _0xb07ax29[_0xb07ax2c];
              if (_0xb07ax2b['indexOf'](',' + _0xb07ax2d + ',') < 0) {
                  var _0xb07ax2e = _0xb07axa[_0xb07ax2d];
                  null != _0xb07ax2e && (_0xb07ax2a['indexOf'](',' + _0xb07ax2d + ',') > -1 && 'more' !== _0xb07ax2d && 'pageNumber' !== _0xb07ax2d ? _0xb07ax1b['append'](_0xb07ax2e) : _0xb07ax20['append'](_0xb07ax2e))
              }
          }
          ;_0xb07ax5['append'](_0xb07ax20)['append'](_0xb07axf)['append'](_0xb07axe)['append'](_0xb07ax12);
          var _0xb07ax2f = 16
            , _0xb07ax30 = 17
            , _0xb07ax31 = 18
            , _0xb07ax32 = 39
            , _0xb07ax33 = 37
            , _0xb07ax34 = 27;

          function _0xb07ax35(_0xb07ax3) {
              switch (_0xb07ax3['keyCode']) {
              case _0xb07ax34:
                  1 == _0xb07axa['isFullscreen'] && _0xb07axa['fullScreen']['trigger']('click');
                  break;
              case _0xb07ax2f:
                  !1;
                  break;
              case _0xb07ax30:
                  !1;
                  break;
              case _0xb07ax31:
                  !1;
                  break;
              case _0xb07ax33:
                  _0xb07ax6['prev']();
                  break;
              case _0xb07ax32:
                  _0xb07ax6['next']()
              }
          }
          document['addEventListener']('keyup', _0xb07ax35, !1),
          _0xb07axa['update'] = function(_0xb07ax4) {
              _0xb07ax1c('ui update');
              var _0xb07ax7 = _0xb07ax6['target']
                , _0xb07ax8 = _0xb07axc(_0xb07ax7['_activePage'] || _0xb07ax6['_activePage'])
                , _0xb07ax9 = _0xb07ax7['pageCount'] || _0xb07ax6['pageCount']
                , _0xb07axb = _0xb07ax7['direction'] == _0xb07ax3['DIRECTION']['RTL']
                , _0xb07axd = 1 == _0xb07ax8 || 0 == _0xb07ax8
                , _0xb07axe = _0xb07ax8 == _0xb07ax9;
              _0xb07axa['next']['show'](),
              _0xb07axa['prev']['show'](),
              _0xb07axa['altNext']['removeClass']('disabled'),
              _0xb07axa['altPrev']['removeClass']('disabled'),
              (_0xb07axd && !_0xb07axb || _0xb07axe && _0xb07axb) && (_0xb07axa['prev']['hide'](),
              _0xb07axa['altPrev']['addClass']('disabled')),
              (_0xb07axe && !_0xb07axb || _0xb07axd && _0xb07axb) && (_0xb07axa['next']['hide'](),
              _0xb07axa['altNext']['addClass']('disabled')),
              _0xb07axa['pageInput']['val'](_0xb07ax8),
              _0xb07axa['pageLabel']['html'](_0xb07ax8 + '/' + _0xb07ax9),
              _0xb07ax5['find']('.pdff-sidemenu-visible')['length'] > 0 ? _0xb07ax5['addClass']('pdff-sidemenu-open') : _0xb07ax5['removeClass']('pdff-sidemenu-open'),
              1 == _0xb07ax4 && _0xb07ax6['resize'](),
              _0xb07ax7['contentProvider']['zoomScale'] == _0xb07ax7['contentProvider']['maxZoom'] ? _0xb07axa['zoomIn']['addClass']('disabled') : _0xb07axa['zoomIn']['removeClass']('disabled'),
              1 == _0xb07ax7['contentProvider']['zoomScale'] ? _0xb07axa['zoomOut']['addClass']('disabled') : _0xb07axa['zoomOut']['removeClass']('disabled')
          }
          ,
          null != _0xb07ax6['target'] && (_0xb07ax6['target']['ui'] = _0xb07axa),
          null != _0xb07axb['onCreateUI'] && _0xb07axb['onCreateUI'](_0xb07ax6)
      }
        , _0xb07ax2b = null;

      function _0xb07ax2c() {
          _0xb07ax2b = function(_0xb07ax3) {
              function _0xb07ax5(_0xb07ax5) {
                  _0xb07ax5 = _0xb07ax5 || {};
                  var _0xb07ax6 = this;
                  _0xb07ax3['call'](this, _0xb07ax5),
                  _0xb07ax6['options'] = _0xb07ax5,
                  _0xb07ax6['canvas'] = _0xb07ax4(_0xb07ax6['renderer']['domElement'])['addClass']('pdff-3dcanvas'),
                  _0xb07ax6['container'] = _0xb07ax5['container'],
                  _0xb07ax6['container']['append'](_0xb07ax6['canvas']),
                  _0xb07ax6['type'] = 'PreviewStage',
                  _0xb07ax6['mouse'] = new THREE['Vector2'],
                  _0xb07ax6['raycaster'] = new THREE['Raycaster'],
                  _0xb07ax6['camera']['position']['set'](0, 20, 600),
                  _0xb07ax6['camera']['lookAt'](new THREE.Vector3(0,0,0)),
                  _0xb07ax6['spotLight']['position']['set'](-220, 330, 550),
                  _0xb07ax6['spotLight']['castShadow'] = !_0xb07ax25 && _0xb07ax5['webglShadow'],
                  _0xb07ax6['spotLight']['shadow'] && (_0xb07ax6['spotLight']['shadow']['bias'] = -8e-4),
                  _0xb07ax6['spotLight']['intensity'] = _0xb07ax12(_0xb07ax5['spotLightIntensity'], _0xb07ax9['spotLightIntensity']),
                  _0xb07ax6['ambientLight']['color'] = new THREE.Color(_0xb07ax12(_0xb07ax5['ambientLightColor'], _0xb07ax9['ambientLightColor'])),
                  _0xb07ax6['ambientLight']['intensity'] = _0xb07ax12(_0xb07ax5['ambientLightIntensity'], _0xb07ax9['ambientLightIntensity']);
                  var _0xb07ax7 = new THREE['ShadowMaterial'];
                  _0xb07ax7['opacity'] = _0xb07ax12(_0xb07ax5['shadowOpacity'], _0xb07ax9['shadowOpacity']),
                  _0xb07ax6['ground']['material'] = _0xb07ax7,
                  _0xb07ax6['ground']['position']['z'] = -2,
                  _0xb07ax6['orbitControl']['maxAzimuthAngle'] = 0,
                  _0xb07ax6['orbitControl']['minAzimuthAngle'] = 0,
                  _0xb07ax6['orbitControl']['minPolarAngle'] = 1.57,
                  _0xb07ax6['orbitControl']['maxPolarAngle'] = 1.57,
                  _0xb07ax6['orbitControl']['mouseButtons']['ORBIT'] = THREE['MOUSE']['RIGHT'],
                  _0xb07ax6['orbitControl']['mouseButtons']['PAN'] = -1,
                  _0xb07ax6['orbitControl']['maxDistance'] = 5e3,
                  _0xb07ax6['orbitControl']['minDistance'] = 50,
                  _0xb07ax6['orbitControl']['noZoom'] = !0,
                  _0xb07ax6['selectiveRendering'] = !0,
                  _0xb07ax6['orbitControl']['zoomSpeed'] = 5,
                  _0xb07ax6['orbitControl']['keyPanSpeed'] = 0,
                  _0xb07ax6['orbitControl']['center']['set'](0, 0, 0),
                  _0xb07ax6['orbitControl']['update'](),
                  _0xb07ax6['swipe_threshold'] = _0xb07ax25 ? 15 : 20;
                  var _0xb07ax8 = _0xb07ax6['cssRenderer'] = new THREE['CSS3DRenderer'];
                  _0xb07ax4(_0xb07ax8['domElement'])['css']({
                      position: 'absolute',
                      top: 0,
                      pointerEvents: 'none'
                  })['addClass']('pdff-3dcanvas pdff-csscanvas'),
                  _0xb07ax6['container'][0]['appendChild'](_0xb07ax8['domElement']);
                  var _0xb07axa = _0xb07ax6['cssScene'] = new THREE['Scene']
                    , _0xb07axb = document['createElement']('div');
                  _0xb07axb['className'] = 'pdff-page-content pdff-page-content-left';
                  var _0xb07axc = document['createElement']('div');
                  _0xb07axc['className'] = 'pdff-page-content pdff-page-content-right';
                  var _0xb07axe = _0xb07axa['divLeft'] = new THREE.CSS3DObject(_0xb07axb)
                    , _0xb07axf = _0xb07axa['divRight'] = new THREE.CSS3DObject(_0xb07axc);

                  function _0xb07ax11() {
                      _0xb07ax6['renderRequestPending'] = !0
                  }
                  _0xb07axa['add'](_0xb07axe),
                  _0xb07axa['add'](_0xb07axf),
                  _0xb07ax6['resizeCallback'] = function() {
                      _0xb07ax8['setSize'](_0xb07ax6['canvas']['width'](), _0xb07ax6['canvas']['height']())
                  }
                  ,
                  window['addEventListener'](_0xb07ax10['move'], _0xb07ax11, !1),
                  window['addEventListener']('keyup', _0xb07ax11, !1),
                  _0xb07ax6['dispose'] = function() {
                      _0xb07ax6['clearChild'](),
                      _0xb07ax6['render'](),
                      window['removeEventListener'](_0xb07ax10['move'], _0xb07ax11, !1),
                      1 == _0xb07ax6['options']['scrollWheel'] && (_0xb07ax6['renderer']['domElement']['removeEventListener']('mousewheel', _0xb07ax13, !1),
                      _0xb07ax6['renderer']['domElement']['removeEventListener']('DOMMouseScroll', _0xb07ax13, !1)),
                      window['removeEventListener']('keyup', _0xb07ax11, !1),
                      _0xb07ax6['renderer']['domElement']['removeEventListener']('mousemove', _0xb07ax14, !1),
                      _0xb07ax6['renderer']['domElement']['removeEventListener']('touchmove', _0xb07ax14, !1),
                      _0xb07ax6['renderer']['domElement']['removeEventListener']('mousedown', _0xb07ax15, !1),
                      _0xb07ax6['renderer']['domElement']['removeEventListener']('touchstart', _0xb07ax15, !1),
                      _0xb07ax6['renderer']['domElement']['removeEventListener']('mouseup', _0xb07ax16, !1),
                      _0xb07ax6['renderer']['domElement']['removeEventListener']('touchend', _0xb07ax16, !1),
                      _0xb07ax6['canvas']['remove'](),
                      _0xb07ax8['domElement']['parentNode']['removeChild'](_0xb07ax8['domElement']),
                      _0xb07ax8 = null,
                      _0xb07ax6['renderCallback'] = null,
                      _0xb07ax6['renderCallback'] = null,
                      _0xb07ax6['orbitControl']['dispose'](),
                      _0xb07ax6['orbitControl'] = null,
                      _0xb07ax6['renderer']['dispose'](),
                      _0xb07ax6['cancelRAF']()
                  }
                  ,
                  _0xb07ax6['renderCallback'] = function() {
                      TWEEN['getAll']()['length'] > 0 && (_0xb07ax6['renderRequestPending'] = !0),
                      TWEEN['update'](),
                      _0xb07ax8['render'](_0xb07axa, _0xb07ax6['camera'])
                  }
                  ;
                  var _0xb07ax13 = function(_0xb07ax3) {
                      var _0xb07ax4 = 0;
                      if (null != _0xb07ax3['wheelDelta'] ? _0xb07ax4 = _0xb07ax3['wheelDelta'] : null != _0xb07ax3['detail'] && (_0xb07ax4 = -_0xb07ax3['detail']),
                      _0xb07ax4) {
                          var _0xb07ax5 = _0xb07ax6['previewObject']['contentProvider']['zoomScale'];
                          (_0xb07ax4 > 0 && 1 == _0xb07ax5 || _0xb07ax4 < 0 && _0xb07ax5 > 1) && _0xb07ax3['preventDefault'](),
                          _0xb07ax6['previewObject']['zoom'](_0xb07ax4 > 0 ? 1 : -1)
                      }
                      ;_0xb07ax11()
                  }
                    , _0xb07ax14 = function(_0xb07ax3) {
                      if (_0xb07ax6['renderRequestPending'] = !0,
                      _0xb07ax3 = _0xb07ax21(_0xb07ax3),
                      _0xb07ax6['isMouseDown'] && 0 != _0xb07ax3['movementX'] && 0 != _0xb07ax3['movementY'] && (_0xb07ax6['isMouseMoving'] = !0),
                      null != _0xb07ax3['touches'] && 2 == _0xb07ax3['touches']['length'] && null != _0xb07ax6['startTouches']) {
                          _0xb07ax6['zoomDirty'] = !0;
                          var _0xb07ax4 = _0xb07axd['getVectorAvg'](_0xb07axd['getTouches'](_0xb07ax3, _0xb07ax6['container']['offset']()))
                            , _0xb07ax5 = _0xb07axd['calculateScale'](_0xb07ax6['startTouches'], _0xb07axd['getTouches'](_0xb07ax3));
                          _0xb07ax6['lastScale'],
                          _0xb07ax6['previewObject']['contentProvider']['zoomScale'],
                          _0xb07ax4['x'],
                          _0xb07ax4['y'];
                          return _0xb07ax6['camera']['position']['z'] = _0xb07ax6['originalZ'] / _0xb07ax5,
                          _0xb07ax6['lastScale'] = _0xb07ax5,
                          _0xb07ax6['lastZoomCenter'] = _0xb07ax4,
                          void (_0xb07ax3['preventDefault']())
                      }
                      ;if (1 == _0xb07ax6['isMouseDown'] && 1 == _0xb07ax6['previewObject']['contentProvider']['zoomScale']) {
                          var _0xb07ax7 = _0xb07ax3['pageX'] - _0xb07ax6['lastPos'];
                          performance['now'](),
                          _0xb07ax6['lastTime'];
                          Math['abs'](_0xb07ax7) > _0xb07ax6['swipe_threshold'] && (_0xb07ax7 < 0 ? _0xb07ax6['target']['next']() : _0xb07ax6['target']['prev'](),
                          _0xb07ax3['preventDefault'](),
                          _0xb07ax6['isMouseDown'] = !1),
                          _0xb07ax6['lastPos'] = _0xb07ax3['pageX'],
                          _0xb07ax6['lastTime'] = performance['now']()
                      }
                  }
                    , _0xb07ax15 = function(_0xb07ax3) {
                      null != (_0xb07ax3 = _0xb07ax21(_0xb07ax3))['touches'] && 2 == _0xb07ax3['touches']['length'] && null == _0xb07ax6['startTouches'] && (_0xb07ax6['startTouches'] = _0xb07axd['getTouches'](_0xb07ax3),
                      _0xb07ax6['lastScale'] = 1,
                      _0xb07ax6['originalZ'] = 1 * _0xb07ax6['camera']['position']['z']),
                      document['activeElement']['blur'](),
                      _0xb07ax6['mouseValue'] = _0xb07ax3['pageX'] + ',' + _0xb07ax3['pageY'],
                      _0xb07ax6['isMouseMoving'] = !1,
                      _0xb07ax6['isMouseDown'] = !0,
                      _0xb07ax6['lastPos'] = _0xb07ax3['pageX'],
                      _0xb07ax6['lastTime'] = performance['now']()
                  }
                    , _0xb07ax16 = function(_0xb07ax3) {
                      if (null != (_0xb07ax3 = _0xb07ax21(_0xb07ax3))['touches'] && 0 == _0xb07ax3['touches']['length']) {
                          _0xb07ax6['previewObject']['contentProvider']['zoomScale'];
                          1 == _0xb07ax6['zoomDirty'] && (_0xb07ax6['previewObject']['contentProvider']['zoomScale'] = _0xb07axd['limitAt'](_0xb07ax6['previewObject']['contentProvider']['zoomScale'] * _0xb07ax6['lastScale'], 1, _0xb07ax6['previewObject']['contentProvider']['maxZoom']),
                          _0xb07ax6['previewObject']['zoomValue'] = 1 * _0xb07ax6['previewObject']['contentProvider']['zoomScale'],
                          _0xb07ax6['previewObject']['resize'](),
                          _0xb07ax6['zoomDirty'] = !1),
                          _0xb07ax6['lastScale'] = null,
                          _0xb07ax6['startTouches'] = null
                      }
                      ;null != _0xb07ax3['touches'] && _0xb07ax3['touches']['length'] > 1 || function(_0xb07ax3) {
                          if (_0xb07ax6['isMouseDown'] = !1,
                          0 !== _0xb07ax3['button']) {
                              return this
                          }
                          ;var _0xb07ax5 = _0xb07ax3['pageX'] + ',' + _0xb07ax3['pageY'];
                          if (_0xb07ax6['isMouseMoving']) {
                              ;
                          } else {
                              if (_0xb07ax5 == _0xb07ax6['mouseValue']) {
                                  _0xb07ax3 = _0xb07ax3 || window['event'],
                                  _0xb07ax3 = _0xb07ax4['event']['fix'](_0xb07ax3);
                                  var _0xb07ax7 = _0xb07ax6['mouse']
                                    , _0xb07ax8 = _0xb07ax6['raycaster'];
                                  _0xb07ax7['x'] = _0xb07ax3['offsetX'] / _0xb07ax6['canvas']['innerWidth']() * 2 - 1,
                                  _0xb07ax7['y'] = 1 - _0xb07ax3['offsetY'] / _0xb07ax6['canvas']['innerHeight']() * 2,
                                  _0xb07ax8['setFromCamera'](_0xb07ax7, _0xb07ax6['camera']);
                                  var _0xb07ax9 = _0xb07ax8['intersectObjects'](_0xb07ax6['target']instanceof MOCKUP['Bundle'] ? _0xb07ax6['target']['children'] : [_0xb07ax6['target']], !0);
                                  if (_0xb07ax9['length'] > 0) {
                                      var _0xb07axa, _0xb07axb = 0;
                                      do {
                                          _0xb07axa = null != _0xb07ax9[_0xb07axb] ? _0xb07ax9[_0xb07axb]['object'] : null,
                                          _0xb07axb++
                                      } while ((_0xb07axa instanceof THREE['BoxHelper'] || !(_0xb07axa instanceof MOCKUP['Paper']) || 1 == _0xb07axa['isFlipping']) && _0xb07axb < _0xb07ax9['length']);
                                      ;null != _0xb07axa['userData']['object'] || (_0xb07axa['angles'][1] > 90 ? 1 != _0xb07axa['isEdge'] && _0xb07ax6['target']['next']() : 1 != _0xb07axa['isEdge'] && _0xb07ax6['target']['prev']())
                                  }
                              }
                          }
                      }(_0xb07ax3)
                  };
                  return _0xb07ax6['renderer']['domElement']['addEventListener']('mousemove', _0xb07ax14, !1),
                  _0xb07ax6['renderer']['domElement']['addEventListener']('touchmove', _0xb07ax14, !1),
                  _0xb07ax6['renderer']['domElement']['addEventListener']('mousedown', _0xb07ax15, !1),
                  _0xb07ax6['renderer']['domElement']['addEventListener']('touchstart', _0xb07ax15, !1),
                  _0xb07ax6['renderer']['domElement']['addEventListener']('mouseup', _0xb07ax16, !1),
                  _0xb07ax6['renderer']['domElement']['addEventListener']('touchend', _0xb07ax16, !1),
                  1 == _0xb07ax6['options']['scrollWheel'] && (_0xb07ax6['renderer']['domElement']['addEventListener']('mousewheel', _0xb07ax13, !1),
                  _0xb07ax6['renderer']['domElement']['addEventListener']('DOMMouseScroll', _0xb07ax13, !1)),
                  _0xb07ax4(_0xb07ax6['renderer']['domElement'])['css']({
                      display: 'block'
                  }),
                  _0xb07ax4(window)['trigger']('resize'),
                  this
              }
              return _0xb07ax29(_0xb07ax5, _0xb07ax3),
              _0xb07ax5['prototype']['width'] = function() {
                  return this['container']['width']()
              }
              ,
              _0xb07ax5['prototype']['height'] = function() {
                  return this['container']['height']()
              }
              ,
              _0xb07ax5
          }(MOCKUP.Stage),
          MOCKUP['PreviewStage'] = _0xb07ax2b;
          var _0xb07ax5 = function(_0xb07ax4) {
              function _0xb07ax5(_0xb07ax3, _0xb07ax5) {
                  (_0xb07ax3 = _0xb07ax3 || {})['folds'] = 1,
                  _0xb07ax4['call'](this, _0xb07ax3, _0xb07ax5),
                  this['angle'] = 0,
                  this['isFlipping'] = !1,
                  this['material']['materials'][5]['transparent'] = !0,
                  this['material']['materials'][4]['transparent'] = !0,
                  this['type'] = 'BookPaper'
              }
              return _0xb07ax29(_0xb07ax5, _0xb07ax4),
              _0xb07ax5['prototype']['tween'] = function(_0xb07ax4, _0xb07ax5) {
                  var _0xb07ax6 = this;
                  _0xb07ax6['originalStiff'] = _0xb07ax6['stiffness'];
                  var _0xb07ax7 = _0xb07ax6['newStiffness']
                    , _0xb07ax8 = _0xb07ax23(_0xb07ax6['parent'])
                    , _0xb07ax9 = _0xb07ax5 - _0xb07ax4
                    , _0xb07axa = _0xb07ax4 > 90
                    , _0xb07axb = _0xb07ax6['parent']['direction'] == _0xb07ax3['DIRECTION']['RTL'];
                  _0xb07ax6['init'] = {
                      angle: _0xb07ax4,
                      angle2: _0xb07ax4 < 90 ? 0 : 180,
                      stiff: _0xb07ax6['originalStiff'],
                      index: _0xb07axa && !_0xb07axb || !_0xb07axa && _0xb07axb ? 1 : 0
                  },
                  _0xb07ax6['first'] = {
                      angle: _0xb07ax4 + _0xb07ax9 / 4,
                      angle2: 90,
                      stiff: _0xb07ax6['originalStiff'],
                      index: _0xb07axa && !_0xb07axb || !_0xb07axa && _0xb07axb ? 1 : 0.25
                  },
                  _0xb07ax6['mid'] = {
                      angle: _0xb07ax4 + 2 * _0xb07ax9 / 4,
                      angle2: _0xb07ax4 < 90 ? 135 : 45,
                      stiff: _0xb07ax6['newStiffness'],
                      index: 0.5
                  },
                  _0xb07ax6['mid2'] = {
                      angle: _0xb07ax4 + 3 * _0xb07ax9 / 4,
                      angle2: _0xb07ax4 < 90 ? 180 : 0,
                      stiff: _0xb07ax6['newStiffness'],
                      index: _0xb07axa && !_0xb07axb || !_0xb07axa && _0xb07axb ? 0.25 : 1
                  },
                  _0xb07ax6['end'] = {
                      angle: _0xb07ax5,
                      angle2: _0xb07ax4 < 90 ? 180 : 0,
                      stiff: _0xb07ax6['newStiffness'],
                      index: _0xb07axa && !_0xb07axb || !_0xb07axa && _0xb07axb ? 0 : 1
                  },
                  _0xb07ax6['isFlipping'] = !0;
                  _0xb07ax8 && (!_0xb07axa && !_0xb07axb || _0xb07axa && _0xb07axb) && (_0xb07ax6['material']['materials'][5]['opacity'] = _0xb07ax6['material']['materials'][4]['opacity'] = 0,
                  _0xb07ax6['castShadow'] = !1),
                  _0xb07ax6['currentTween'] = new TWEEN.Tween(_0xb07ax6['init'])['to']({
                      angle: [_0xb07ax6['first']['angle'], _0xb07ax6['mid']['angle'], _0xb07ax6['mid2']['angle'], _0xb07ax6['end']['angle']],
                      angle2: [_0xb07ax6['first']['angle2'], _0xb07ax6['mid']['angle2'], _0xb07ax6['mid2']['angle2'], _0xb07ax6['end']['angle2']],
                      stiff: [_0xb07ax6['first']['stiff'], _0xb07ax6['mid']['stiff'], _0xb07ax6['mid2']['stiff'], _0xb07ax6['end']['stiff']],
                      index: [_0xb07ax6['first']['index'], _0xb07ax6['mid']['index'], _0xb07ax6['mid2']['index'], _0xb07ax6['end']['index']]
                  }, _0xb07ax6['parent']['duration'])['onUpdate'](function(_0xb07ax3) {
                      var _0xb07ax4;
                      _0xb07ax4 = this,
                      _0xb07ax6['angles'][1] = _0xb07ax4['angle'],
                      _0xb07ax6['angles'][4] = _0xb07ax6['isHard'] ? _0xb07ax4['angle'] : _0xb07ax4['angle2'],
                      1 == _0xb07ax6['isHard'] ? _0xb07ax6['stiffness'] = 0 : (_0xb07ax6['stiffness'] = _0xb07ax4['stiff'] / (_0xb07ax7 + 1e-5) * (_0xb07ax6['newStiffness'] + 1e-5),
                      _0xb07ax6['stiffness'] = isNaN(_0xb07ax6['stiffness']) ? 0 : _0xb07ax4['stiff']),
                      _0xb07ax8 && (_0xb07ax6['material']['materials'][5]['opacity'] = _0xb07ax6['material']['materials'][4]['opacity'] = _0xb07ax4['index'],
                      _0xb07ax6['castShadow'] = _0xb07ax4['index'] > 0.5),
                      _0xb07ax6['updateAngle'](!0)
                  })['easing'](TWEEN['Easing']['Sinusoidal'].Out)['onComplete'](function(_0xb07ax3) {
                      _0xb07ax6['stiffness'] = _0xb07ax6['newStiffness'],
                      _0xb07ax6['updateAngle'](),
                      _0xb07ax6['material']['materials'][5]['opacity'] = _0xb07ax6['material']['materials'][4]['opacity'] = 1,
                      _0xb07ax6['castShadow'] = !0,
                      _0xb07ax6['isFlipping'] = !1,
                      _0xb07ax6['parent'] && _0xb07ax6['parent']['refresh'] && _0xb07ax6['parent']['refresh']()
                  })['start']()
              }
              ,
              _0xb07ax5
          }(MOCKUP.FlexBoxPaper);
          MOCKUP['BookPaper'] = _0xb07ax5;
          var _0xb07ax6 = function(_0xb07ax4) {
              function _0xb07ax5(_0xb07ax5, _0xb07ax6) {
                  (_0xb07ax5 = _0xb07ax5 || {})['segments'] = _0xb07ax5['segments'] || 50,
                  this['pageCount'] = _0xb07ax5['pageCount'],
                  this['height'] = _0xb07ax5['height'],
                  this['width'] = _0xb07ax5['width'],
                  this['pageCount'] = 1 == this['pageCount'] ? this['pageCount'] : 2 * Math['ceil'](this['pageCount'] / 2),
                  this['direction'] = _0xb07ax5['direction'] || _0xb07ax3['DIRECTION']['LTR'],
                  this['startPage'] = 1,
                  this['endPage'] = this['pageCount'],
                  this['stackCount'] = _0xb07ax5['stackCount'] || 6,
                  this['materials'] = [],
                  _0xb07ax4['call'](this, _0xb07ax5, _0xb07ax6),
                  this['angles'] = [0, 0, 0, 0, 0, 0],
                  this['stiffness'] = null == _0xb07ax5['stiffness'] ? 1.5 : _0xb07ax5['stiffness'],
                  this['hardConfig'] = _0xb07ax5['hard'],
                  this['_activePage'] = _0xb07ax5['openPage'] || this['startPage'],
                  this['createStack'](_0xb07ax5),
                  this['pageMode'] = _0xb07ax5['pageMode'] || (_0xb07ax25 || this['pageCount'] <= 2 ? _0xb07ax3['PAGE_MODE']['SINGLE'] : _0xb07ax3['PAGE_MODE']['DOUBLE']),
                  this['singlePageMode'] = _0xb07ax5['singlePageMode'] || (_0xb07ax25 ? _0xb07ax3['SINGLE_PAGE_MODE']['BOOKLET'] : _0xb07ax3['SINGLE_PAGE_MODE']['ZOOM']),
                  this['type'] = 'Book'
              }
              return _0xb07ax29(_0xb07ax5, _0xb07ax4),
              _0xb07ax5['prototype']['getPageByNumber'] = function(_0xb07ax3) {
                  var _0xb07ax4 = _0xb07ax23(this) ? _0xb07ax24(this) ? _0xb07ax3 + 1 : _0xb07ax3 : Math['floor']((_0xb07ax3 - 1) / 2);
                  return this['getObjectByName'](_0xb07ax4.toString())
              }
              ,
              _0xb07ax5['prototype']['isPageHard'] = function(_0xb07ax3) {
                  return _0xb07axd['isHardPage'](this['hardConfig'], _0xb07ax3, this['pageCount'])
              }
              ,
              _0xb07ax5['prototype']['activePage'] = function(_0xb07ax3) {
                  if (null == _0xb07ax3) {
                      return this['_activePage']
                  }
                  ;this['gotoPage'](_0xb07ax3)
              }
              ,
              _0xb07ax5['prototype']['gotoPage'] = function(_0xb07ax3) {
                  _0xb07ax3 = parseInt(_0xb07ax3, 10),
                  this['_activePage'] = _0xb07ax3,
                  1 == this['autoPlay'] && this['previewObject']['setAutoPlay'](this['autoPlay']),
                  this['updatePage'](_0xb07ax3),
                  this && this['thumblist'] && this['thumblist']['review'] && this['thumblist']['review']()
              }
              ,
              _0xb07ax5['prototype']['moveBy'] = function(_0xb07ax3) {
                  var _0xb07ax4 = this['_activePage'] + _0xb07ax3;
                  _0xb07ax4 = _0xb07ax18(_0xb07ax4, this['startPage'], this['endPage']),
                  this['gotoPage'](_0xb07ax4)
              }
              ,
              _0xb07ax5['prototype']['next'] = function(_0xb07ax4) {
                  null == _0xb07ax4 && (_0xb07ax4 = this['direction'] == _0xb07ax3['DIRECTION']['RTL'] ? -this['pageMode'] : this['pageMode']),
                  this['moveBy'](_0xb07ax4)
              }
              ,
              _0xb07ax5['prototype']['prev'] = function(_0xb07ax4) {
                  null == _0xb07ax4 && (_0xb07ax4 = this['direction'] == _0xb07ax3['DIRECTION']['RTL'] ? this['pageMode'] : -this['pageMode']),
                  this['moveBy'](_0xb07ax4)
              }
              ,
              _0xb07ax5['prototype']['updateAngle'] = function() {
                  for (var _0xb07ax3 = this['angles'][1], _0xb07ax4 = this['angles'][4] - _0xb07ax3, _0xb07ax5 = this['stackCount'], _0xb07ax6 = 0; _0xb07ax6 < _0xb07ax5; _0xb07ax6++) {
                      var _0xb07ax7 = this['children'][_0xb07ax6];
                      _0xb07ax7['angles'][1] = _0xb07ax3 + _0xb07ax6 * _0xb07ax4 / (100 * _0xb07ax5),
                      _0xb07ax7['stiffness'] = this['stiffness'],
                      _0xb07ax7['updateAngle']()
                  }
              }
              ,
              _0xb07ax5['prototype']['refresh'] = function() {
                  this['updatePage'](this._activePage),
                  null != this['flipCallback'] && this['flipCallback']()
              }
              ,
              _0xb07ax5['prototype']['updatePage'] = function(_0xb07ax4) {
                  var _0xb07ax5 = this['direction'] == _0xb07ax3['DIRECTION']['RTL']
                    , _0xb07ax6 = _0xb07ax23(this)
                    , _0xb07ax7 = (_0xb07ax1f(_0xb07ax4),
                  _0xb07ax6 ? 1 : 2);
                  _0xb07ax4 = Math['floor'](_0xb07ax4 / _0xb07ax7),
                  _0xb07ax5 && (_0xb07ax4 = this['pageCount'] / _0xb07ax7 - _0xb07ax4);
                  var _0xb07ax8 = this['oldBaseNumber'] || 0
                    , _0xb07axa = this['pageCount'] / _0xb07ax7
                    , _0xb07axb = this['stackCount']
                    , _0xb07axc = _0xb07ax6 ? 0 : (0.5 - Math['abs'](_0xb07axa / 2 - _0xb07ax4) / _0xb07axa) / this['stiffness']
                    , _0xb07axd = Math['floor'](_0xb07axb / 2)
                    , _0xb07axe = !1;
                  _0xb07ax8 > _0xb07ax4 ? (_0xb07axe = !0,
                  this['children'][_0xb07axb - 1]['skipFlip'] = !0,
                  this['children']['unshift'](this['children']['pop']())) : _0xb07ax8 < _0xb07ax4 && (this['children'][0]['skipFlip'] = !0,
                  this['children']['push'](this['children']['shift']()));
                  for (var _0xb07axf = 5 / _0xb07axa, _0xb07ax10 = _0xb07axf * _0xb07ax4 / 2, _0xb07ax11 = _0xb07axf * (_0xb07axa - _0xb07ax4) / 2, _0xb07ax12 = _0xb07ax10 < _0xb07ax11 ? _0xb07ax11 : _0xb07ax10, _0xb07ax13 = 0; _0xb07ax13 < _0xb07axb; _0xb07ax13++) {
                      var _0xb07ax14, _0xb07ax15 = this['children'][_0xb07ax13], _0xb07ax16 = (_0xb07ax15['color'],
                      _0xb07ax15['angles'][1]), _0xb07ax17 = _0xb07ax4 - _0xb07axd + _0xb07ax13;
                      _0xb07ax5 && (_0xb07ax17 = _0xb07ax6 ? this['pageCount'] - _0xb07ax17 : Math['floor'](this['pageCount'] / 2) - _0xb07ax17 - 1);
                      var _0xb07ax18 = _0xb07ax15['isHard'] = this['isPageHard'](_0xb07ax17)
                        , _0xb07ax19 = _0xb07ax15['name'];
                      _0xb07ax15['isEdge'] = !1,
                      0 == _0xb07ax13 ? _0xb07ax15['depth'] = _0xb07ax10 < 0.4 ? 0.4 : _0xb07ax10 : _0xb07ax13 == _0xb07axb - 1 ? _0xb07ax15['depth'] = _0xb07ax11 < 0.4 ? 0.4 : _0xb07ax11 : (_0xb07ax15['depth'] = 0.4,
                      _0xb07ax15['isEdge'] = !1),
                      1 == _0xb07ax15['isFlipping'] && (_0xb07ax15['depth'] = 0.4),
                      _0xb07ax15['position']['x'] = 0;
                      var _0xb07ax1a = 0.02 * _0xb07ax13
                        , _0xb07ax1b = 180 - 0.02 * (_0xb07ax13 - _0xb07axd) + 0.02 * _0xb07ax13;
                      if (_0xb07ax13 < _0xb07axd ? (_0xb07ax15['newStiffness'] = _0xb07ax18 || 0 == this['stiffness'] ? 0 : _0xb07axc / (_0xb07ax4 / _0xb07axa) / 4,
                      _0xb07ax14 = _0xb07ax1a,
                      _0xb07ax15['position']['z'] = _0xb07ax12 - 0.4 * (-_0xb07ax13 + _0xb07axd),
                      1 == _0xb07axe && (_0xb07ax15['position']['z'] -= 0.4)) : (_0xb07ax14 = _0xb07ax1b,
                      _0xb07ax15['newStiffness'] = _0xb07ax18 || 0 == this['stiffness'] ? 0 : _0xb07axc / (Math['abs'](_0xb07axa - _0xb07ax4) / _0xb07axa) / 4,
                      _0xb07ax15['position']['z'] = _0xb07ax12 - 0.4 * (-_0xb07axb + _0xb07ax13 + _0xb07axd + 1) - _0xb07ax15['depth']),
                      0 == _0xb07ax15['isFlipping']) {
                          if (Math['abs'](_0xb07ax16 - _0xb07ax14) > 20 && 0 == _0xb07ax15['skipFlip']) {
                              _0xb07ax15['depth'] = 0.4;
                              var _0xb07ax1c = _0xb07ax15['stiffness'];
                              _0xb07ax1c = _0xb07ax16 > _0xb07ax14 ? _0xb07axc / (Math['abs'](_0xb07axa - _0xb07ax4) / _0xb07axa) / 4 : _0xb07axc / (_0xb07ax4 / _0xb07axa) / 4,
                              _0xb07ax15['position']['z'] += 0.4,
                              _0xb07ax15['stiffness'] = isNaN(_0xb07ax1c) ? _0xb07ax15['stiffness'] : _0xb07ax1c,
                              _0xb07ax15['updateAngle'](!0),
                              _0xb07ax15['targetStiffness'] = _0xb07ax18 ? 0 : _0xb07ax13 < _0xb07ax4 ? _0xb07axc / (Math['abs'](_0xb07axa - _0xb07ax4) / _0xb07axa) / 4 : _0xb07axc / (_0xb07ax4 / _0xb07axa) / 4,
                              _0xb07ax15['targetStiffness'] = _0xb07ax18 ? 0 : isNaN(_0xb07ax15['targetStiffness']) ? _0xb07ax15['stiffness'] : _0xb07ax15['targetStiffness'],
                              _0xb07ax15['isFlipping'] = !0,
                              _0xb07ax15['tween'](_0xb07ax16, _0xb07ax14),
                              null != this['preFlipCallback'] && this['preFlipCallback']()
                          } else {
                              _0xb07ax15['skipFlip'] = !1,
                              _0xb07ax15['newStiffness'] = isNaN(_0xb07ax15['newStiffness']) ? 0 : _0xb07ax15['newStiffness'],
                              _0xb07ax15['angles'][1] == _0xb07ax14 && _0xb07ax15['stiffness'] == _0xb07ax15['newStiffness'] && _0xb07ax15['depth'] == _0xb07ax15['oldDepth'] || (_0xb07ax15['angles'][1] = _0xb07ax15['angles'][4] = _0xb07ax14,
                              _0xb07ax15['stiffness'] = _0xb07ax15['newStiffness'],
                              _0xb07ax15['updateAngle'](!0))
                          }
                      }
                      ;_0xb07ax15['visible'] = _0xb07ax6 ? _0xb07ax5 ? _0xb07ax13 < _0xb07axd || _0xb07ax15['isFlipping'] : _0xb07ax13 >= _0xb07axd || _0xb07ax15['isFlipping'] : _0xb07ax17 >= 0 && _0xb07ax17 < _0xb07axa || _0xb07ax6 && _0xb07ax17 == _0xb07axa,
                      null != this['requestPage'] && 1 == _0xb07ax15['visible'] && (_0xb07ax15['name'] = _0xb07ax17.toString(),
                      _0xb07ax15['name'] != _0xb07ax19 && (_0xb07ax15['textureLoaded'] = !1,
                      _0xb07ax15['frontImage'](_0xb07ax9['textureLoadFallback']),
                      _0xb07ax15['frontPageStamp'] = '-1',
                      _0xb07ax15['frontTextureLoaded'] = !1,
                      _0xb07ax15['thumbLoaded'] = !1,
                      _0xb07ax15['backImage'](_0xb07ax9['textureLoadFallback']),
                      _0xb07ax15['backPageStamp'] = '-1',
                      _0xb07ax15['backTextureLoaded'] = !1,
                      this['requestPage']())),
                      _0xb07ax15['oldDepth'] = _0xb07ax15['depth'];
                      var _0xb07ax1d = Math['abs'](_0xb07ax15['geometry']['boundingBox']['max']['x']) < Math['abs'](_0xb07ax15['geometry']['boundingBox']['min']['x']) ? _0xb07ax15['geometry']['boundingBox']['max']['x'] : _0xb07ax15['geometry']['boundingBox']['min']['x'];
                      _0xb07ax15['position']['x'] = 1 == _0xb07ax15['isEdge'] && 0 == _0xb07ax15['isFlipping'] ? _0xb07ax13 < _0xb07axd ? _0xb07ax1d : -_0xb07ax1d : 0
                  }
                  ;this['oldBaseNumber'] = _0xb07ax4,
                  null != this['updatePageCallback'] && this['updatePageCallback']()
              }
              ,
              _0xb07ax5['prototype']['createCover'] = function(_0xb07ax3) {
                  _0xb07ax3['width'] = 2 * _0xb07ax3['width'],
                  this['cover'] = new MOCKUP.BiFold(_0xb07ax3),
                  this['add'](this['cover'])
              }
              ,
              _0xb07ax5['prototype']['createStack'] = function(_0xb07ax3) {
                  for (var _0xb07ax4 = 'red,green,blue,yellow,orange,black'['split'](','), _0xb07ax5 = 0; _0xb07ax5 < this['stackCount']; _0xb07ax5++) {
                      _0xb07ax3['angles'] = [, this['stackCount'] - _0xb07ax5],
                      _0xb07ax3['stiffness'] = (this['stackCount'] - _0xb07ax5) / 100;
                      var _0xb07ax6 = new MOCKUP.BookPaper(_0xb07ax3);
                      _0xb07ax6['angles'][1] = 180,
                      _0xb07ax6['index'] = _0xb07ax5,
                      _0xb07ax6['updateAngle'](),
                      _0xb07ax6['textureReady'] = !1,
                      _0xb07ax6['textureRequested'] = !1,
                      this['add'](_0xb07ax6),
                      _0xb07ax6['color'] = _0xb07ax4[_0xb07ax5],
                      _0xb07ax6['position']['z'] = -1 * _0xb07ax5
                  }
              }
              ,
              _0xb07ax5['prototype']['shininess'] = function(_0xb07ax3) {
                  if (null == _0xb07ax3) {
                      return this['mainObject']['shininess']()
                  }
                  ;this['mainObject']['shininess'](_0xb07ax3)
              }
              ,
              _0xb07ax5['prototype']['bumpScale'] = function(_0xb07ax3) {
                  if (null == _0xb07ax3) {
                      return this['mainObject']['bumpScale']()
                  }
                  ;this['mainObject']['bumpScale'](_0xb07ax3)
              }
              ,
              _0xb07ax5['prototype']['frontImage'] = function(_0xb07ax3) {
                  if (null == _0xb07ax3) {
                      return this['mainObject']['frontImage']()
                  }
                  ;this['mainObject']['frontImage'](_0xb07ax3)
              }
              ,
              _0xb07ax5['prototype']['backImage'] = function(_0xb07ax3) {
                  if (null == _0xb07ax3) {
                      return this['mainObject']['backImage']()
                  }
                  ;this['mainObject']['backImage'](_0xb07ax3)
              }
              ,
              _0xb07ax5
          }(MOCKUP.Bundle);
          MOCKUP['Book'] = _0xb07ax6
      }
      var _0xb07ax2d = function(_0xb07ax5) {
          function _0xb07ax6(_0xb07ax4) {
              _0xb07ax4 = _0xb07ax4 || {},
              this['type'] = 'PreviewObject';
              var _0xb07ax5 = this;

              function _0xb07ax6() {
                  setTimeout(function() {
                      _0xb07ax5['resize']()
                  }, 50)
              }
              _0xb07ax5['zoomValue'] = 1,
              window['addEventListener']('resize', _0xb07ax6, !1),
              this['sound'] = document['createElement']('audio'),
              this['sound']['setAttribute']('src', _0xb07ax4['soundFile'] + '?ver=' + _0xb07ax3['version']),
              this['sound']['setAttribute']('type', 'audio/mpeg'),
              this['autoPlayFunction'] = function() {
                  _0xb07ax5 && _0xb07ax5['target']['autoPlay'] && (_0xb07ax5['target']['direction'] == _0xb07ax3['DIRECTION']['RTL'] ? _0xb07ax5['target']['prev']() : _0xb07ax5['target']['next']())
              }
              ,
              this['dispose'] = function() {
                  if (clearInterval(this['autoPlayTimer']),
                  this['autoPlayTimer'] = null,
                  this['autoPlayFunction'] = null,
                  this['target'] && this['target']['children']) {
                      for (var _0xb07ax3 = 0; _0xb07ax3 < this['target']['children']['length']; _0xb07ax3++) {
                          var _0xb07ax4 = this['target']['children'][_0xb07ax3];
                          _0xb07ax4 && _0xb07ax4['currentTween'] && _0xb07ax4['currentTween']['stop']()
                      }
                  }
                  ;this['zoomTween'] && (this['zoomTween']['stop'] && this['zoomTween']['stop'](),
                  this['zoomTween'] = null),
                  this['container'] && this['container']['info'] && this['container']['info']['remove'] && this['container']['info']['remove'](),
                  this['target'] && this['target']['dispose'] && this['target']['dispose'](),
                  this['target'] = null,
                  this['stage'] && this['stage']['dispose'] && this['stage']['dispose'](),
                  this['stage'] = null,
                  this['ui'] && this['ui']['dispose'] && this['ui']['dispose'](),
                  this['ui'] = null,
                  this['contentProvider'] && this['contentProvider']['dispose'] && this['contentProvider']['dispose'](),
                  this['contentProvider'] = null,
                  window['removeEventListener']('resize', _0xb07ax6)
              }
          }
          return _0xb07ax6['prototype'] = {
              start: function() {
                  this['target']['gotoPage'](this['target']['startPage'])
              },
              end: function() {
                  this['target']['gotoPage'](this['target']['endPage'])
              },
              next: function() {},
              prev: function() {},
              zoom: function(_0xb07ax3) {
                  this['pendingZoom'] = !0,
                  this['zoomDelta'] = _0xb07ax3,
                  this['resize'](),
                  this['ui']['update']()
              },
              resize: function() {
                  var _0xb07ax5 = this;
                  if (null != _0xb07ax5['target'] && null != _0xb07ax5['target']['ui'] && null != _0xb07ax5['target']['contentProvider'] && null != _0xb07ax5['target']['contentProvider']['viewport'] && null != _0xb07ax5['target']['stage']) {
                      this['ui'] && 1 == this['ui']['isFullscreen'] && 1 == _0xb07axd['hasFullscreenEnabled']() && null == _0xb07axd['getFullscreenElement']() && this['ui']['switchFullscreen']();
                      var _0xb07ax6, _0xb07ax7, _0xb07ax8, _0xb07ax9, _0xb07axa, _0xb07axb, _0xb07axc = _0xb07ax5['target'], _0xb07axf = _0xb07ax5['container'], _0xb07ax10 = _0xb07ax5['options'], _0xb07ax11 = _0xb07axc['stage'], _0xb07ax12 = _0xb07axc['contentProvider'], _0xb07ax13 = _0xb07ax12['pageRatio'], _0xb07ax14 = (_0xb07ax12['zoomViewport'],
                      _0xb07ax24(_0xb07axc)), _0xb07ax15 = 'css' !== _0xb07axc['mode'], _0xb07ax16 = (_0xb07ax12['pageRatio'],
                      _0xb07axf['hasClass']('pdff-sidemenu-open') ? 220 : 0), _0xb07ax17 = this['target']['pageMode'] == _0xb07ax3['PAGE_MODE']['SINGLE'];
                      _0xb07axf['height'](_0xb07ax10['height']);
                      var _0xb07ax1a = Math['min'](_0xb07axf['height'](), _0xb07ax4(window)['height']());
                      _0xb07axf['height'](_0xb07ax1a);
                      var _0xb07ax1b = _0xb07axf['width']();
                      _0xb07ax1b < 400 ? _0xb07ax5['container']['addClass']('pdff-xs') : _0xb07ax5['container']['removeClass']('pdff-xs');
                      var _0xb07ax1c = _0xb07axf['find']('.pdff-ui-controls')['height']()
                        , _0xb07ax1d = _0xb07ax10['paddingTop'] + (_0xb07ax10['controlsPosition'] == _0xb07ax3['CONTROLSPOSITION']['TOP'] ? _0xb07ax1c : 0)
                        , _0xb07ax1e = _0xb07ax10['paddingRight']
                        , _0xb07ax1f = _0xb07ax10['paddingBottom'] + (_0xb07ax10['controlsPosition'] == _0xb07ax3['CONTROLSPOSITION']['BOTTOM'] ? _0xb07ax1c : 0)
                        , _0xb07ax20 = _0xb07ax10['paddingLeft']
                        , _0xb07ax21 = _0xb07ax1b - _0xb07ax16
                        , _0xb07ax22 = _0xb07ax1a
                        , _0xb07ax23 = (_0xb07ax1d = isNaN(_0xb07ax1d) ? 0 : _0xb07ax18(_0xb07ax1d, 0, _0xb07ax1d)) + (_0xb07ax1f = isNaN(_0xb07ax1f) ? 0 : _0xb07ax18(_0xb07ax1f, 0, _0xb07ax1f))
                        , _0xb07ax25 = (_0xb07ax20 = isNaN(_0xb07ax20) ? 0 : _0xb07ax18(_0xb07ax20, 0, _0xb07ax20)) + (_0xb07ax1e = isNaN(_0xb07ax1e) ? 0 : _0xb07ax18(_0xb07ax1e, 0, _0xb07ax1e))
                        , _0xb07ax26 = _0xb07ax21 - _0xb07ax25
                        , _0xb07ax27 = _0xb07ax22 - _0xb07ax23;
                      if (_0xb07ax8 = Math['floor'](_0xb07ax17 ? _0xb07ax26 : _0xb07ax26 / 2),
                      (_0xb07ax6 = (_0xb07ax7 = Math['floor'](_0xb07ax8 / _0xb07ax13)) > _0xb07ax27) && (_0xb07ax8 = (_0xb07ax7 = _0xb07ax27) * _0xb07ax13),
                      _0xb07axb = _0xb07ax12['maxZoom'] = _0xb07ax12['zoomViewport']['height'] / _0xb07ax7,
                      null == _0xb07ax5['zoomValue'] && (_0xb07ax5['zoomValue'] = 1),
                      null == _0xb07ax12['zoomScale'] && (_0xb07ax12['zoomScale'] = 1),
                      1 == _0xb07ax5['pendingZoom'] && null != _0xb07ax5['zoomDelta']) {
                          _0xb07ax5['zoomDelta'];
                          var _0xb07ax28, _0xb07ax29 = Math['max'](_0xb07ax7, _0xb07ax8);
                          _0xb07ax5['zoomValue'] = _0xb07ax5['zoomDelta'] > 0 ? _0xb07ax5['zoomValue'] * _0xb07ax5['options']['zoomRatio'] : _0xb07ax5['zoomValue'] / _0xb07ax5['options']['zoomRatio'],
                          _0xb07ax5['zoomValue'] = _0xb07ax18(_0xb07ax5['zoomValue'], 1, _0xb07axb),
                          1 == _0xb07ax5['zoomValue'] ? _0xb07ax12['zoomScale'] = 1 : (_0xb07ax28 = _0xb07ax7 * _0xb07ax5['zoomValue'],
                          _0xb07ax28 = _0xb07axd['zoomStops'](_0xb07ax28, _0xb07ax5['options']['zoomRatio'], _0xb07ax5['zoomDelta'] > 0, Math['max'](_0xb07ax8, _0xb07ax7)),
                          _0xb07ax12['zoomScale'] = _0xb07ax18(_0xb07ax28 / _0xb07ax29, 1, _0xb07axb))
                      }
                      ;_0xb07axa = _0xb07ax12['zoomScale'],
                      _0xb07ax12['checkViewportSize'](_0xb07ax8, _0xb07ax7, _0xb07axa),
                      _0xb07ax12['contentSourceType'] == _0xb07axe['PDF'] && (_0xb07ax8 = _0xb07ax12['imageViewport']['width'] / _0xb07axa,
                      _0xb07ax7 = _0xb07ax12['imageViewport']['height'] / _0xb07axa),
                      1 != _0xb07ax12['zoomScale'] && this['target']['container']['addClass']('pdff-zoom-enabled');
                      var _0xb07ax2a = _0xb07axc['zoomWidth'] = Math['floor'](_0xb07ax8 * _0xb07axa)
                        , _0xb07ax2b = _0xb07axc['zoomHeight'] = Math['floor'](_0xb07ax7 * _0xb07axa)
                        , _0xb07ax2c = 2 * _0xb07ax2a;
                      if (_0xb07ax15) {
                          var _0xb07ax2d = _0xb07ax2b / _0xb07axc['height']
                            , _0xb07ax2e = _0xb07ax6 ? _0xb07axa * (_0xb07ax7 + _0xb07ax23) / _0xb07ax2d : _0xb07axa * (_0xb07ax8 * (_0xb07ax17 ? 1 : 2) + _0xb07ax25) / _0xb07ax2d / (_0xb07ax21 / _0xb07ax22);
                          _0xb07ax11['resizeCanvas'](_0xb07ax21, _0xb07ax22),
                          _0xb07ax9 = 1 / (2 * Math['tan'](Math['PI'] * _0xb07ax11['camera']['fov'] * 0.5 / 180) / (_0xb07ax2e / _0xb07axa)) + 2.2,
                          _0xb07ax11['camera']['updateProjectionMatrix'](),
                          _0xb07ax11['renderRequestPending'] = !0;
                          var _0xb07ax2f = (_0xb07ax1d - _0xb07ax1f) * (_0xb07axc['height'] / _0xb07ax7) / _0xb07axa / 2
                            , _0xb07ax30 = 1 == _0xb07ax12['zoomScale'];
                          _0xb07ax11['camera']['position']['z'] !== _0xb07ax9 && 1 == _0xb07ax5['pendingZoom'] ? (null != _0xb07ax5['zoomTween'] && _0xb07ax5['zoomTween']['stop'](),
                          _0xb07ax5['zoomTween'] = new TWEEN.Tween({
                              campos: _0xb07ax11['camera']['position']['z'],
                              otx: _0xb07ax11['orbitControl']['target']['x'],
                              oty: _0xb07ax11['orbitControl']['target']['y'],
                              otz: _0xb07ax11['orbitControl']['target']['z']
                          })['delay'](0)['to']({
                              campos: _0xb07ax9,
                              otx: 0,
                              oty: _0xb07ax2f,
                              otz: 0
                          }, 100)['onUpdate'](function() {
                              _0xb07ax11['camera']['position']['z'] = this['campos'],
                              _0xb07ax30 && (_0xb07ax11['camera']['position']['y'] = this['oty'],
                              _0xb07ax11['orbitControl']['target'] = new THREE.Vector3(this['otx'],this['oty'],this['otz'])),
                              _0xb07ax11['orbitControl']['update']()
                          })['easing'](TWEEN['Easing']['Linear'].None)['onComplete'](function() {
                              _0xb07ax11['camera']['position']['z'] = _0xb07ax9,
                              1 == _0xb07ax12['zoomScale'] && (_0xb07ax11['camera']['position']['set'](0, _0xb07ax2f, _0xb07ax9),
                              _0xb07ax11['orbitControl']['target'] = new THREE.Vector3(0,_0xb07ax2f,0)),
                              _0xb07ax11['orbitControl']['update']()
                          })['start']()) : (1 == _0xb07ax12['zoomScale'] && (_0xb07ax11['camera']['position']['set'](0, _0xb07ax2f, _0xb07ax9),
                          _0xb07ax11['orbitControl']['target'] = new THREE.Vector3(0,_0xb07ax2f,0)),
                          _0xb07ax11['orbitControl']['update']()),
                          _0xb07ax11['orbitControl']['update'](),
                          _0xb07ax11['orbitControl']['mouseButtons']['ORBIT'] = 1 != _0xb07axa ? -1 : THREE['MOUSE']['RIGHT'],
                          _0xb07ax11['orbitControl']['mouseButtons']['PAN'] = 1 != _0xb07axa ? THREE['MOUSE']['LEFT'] : -1
                      } else {
                          _0xb07axc['pageWidth'] = Math['round'](_0xb07ax8),
                          _0xb07axc['fullWidth'] = 2 * _0xb07axc['pageWidth'],
                          _0xb07axc['height'] = Math['round'](_0xb07ax7);
                          var _0xb07ax31 = _0xb07axc['shiftHeight'] = Math['round'](_0xb07ax18((_0xb07ax2b - _0xb07ax22 + _0xb07ax23) / 2, 0, _0xb07ax2b))
                            , _0xb07ax32 = _0xb07axc['shiftWidth'] = Math['round'](_0xb07ax18((_0xb07ax2c - _0xb07ax21 + _0xb07ax25) / 2, 0, _0xb07ax2c));
                          1 == _0xb07axa && (_0xb07axc['left'] = 0,
                          _0xb07axc['top'] = 0),
                          _0xb07axc['stage']['css']({
                              top: -_0xb07ax31,
                              bottom: -_0xb07ax31,
                              right: -_0xb07ax32 + (_0xb07ax14 ? _0xb07ax16 : 0),
                              left: -_0xb07ax32 + (_0xb07ax14 ? 0 : _0xb07ax16),
                              paddingTop: _0xb07ax1d,
                              paddingRight: _0xb07ax1e,
                              paddingBottom: _0xb07ax1f,
                              paddingLeft: _0xb07ax20,
                              transform: 'translate3d(' + _0xb07axc['left'] + 'px,' + _0xb07axc['top'] + 'px,0)'
                          }),
                          _0xb07axc['stageHeight'] = _0xb07ax11['height'](),
                          _0xb07axc['wrapper']['css']({
                              width: _0xb07ax2c,
                              height: _0xb07ax2b,
                              marginTop: _0xb07ax1a - _0xb07ax2b - _0xb07ax23 > 0 ? (_0xb07ax1a - _0xb07ax23 - _0xb07ax2b) / 2 : 0
                          });
                          var _0xb07ax33 = Math['floor'](_0xb07ax19(_0xb07ax8, _0xb07ax7) * _0xb07axa);
                          _0xb07axc['stage']['find']('.pdff-page-wrapper')['width'](_0xb07ax33)['height'](_0xb07ax33),
                          _0xb07axc['stage']['find']('.ppdff-flipbook-page, .pdff-page-front , .pdff-page-back, .pdff-page-fold-inner-shadow')['height'](_0xb07ax2b)['width'](_0xb07ax2a)
                      }
                      ;_0xb07ax5['checkCenter']({
                          type: 'resize'
                      }),
                      1 == _0xb07ax12['zoomScale'] && this['target']['container']['removeClass']('pdff-zoom-enabled'),
                      _0xb07axc['thumblist'] && _0xb07axc['thumblist']['reset'](_0xb07ax4(_0xb07axc['thumblist']['container'])['height']()),
                      _0xb07ax5['pendingZoom'] = !1
                  }
              },
              playSound: function() {
                  try {
                      this['options'] && 1 == this['options']['enableSound'] && (this['sound']['currentTime'] = 0,
                      this['sound']['play']())
                  } catch (_0xb07ax3) {}
              },
              setPageMode: function(_0xb07ax4) {
                  1 == _0xb07ax4 ? (this['ui']['pageMode']['addClass'](this['options']['icons']['doublepage']),
                  this['ui']['pageMode']['html']('<span>' + this['options']['text']['doublePageMode'] + '</span>'),
                  this['ui']['pageMode']['attr']('title', this['options']['text']['doublePageMode']),
                  this['target']['pageMode'] = _0xb07ax3['PAGE_MODE']['SINGLE']) : (this['ui']['pageMode']['removeClass'](this['options']['icons']['doublepage']),
                  this['ui']['pageMode']['html']('<span>' + this['options']['text']['singlePageMode'] + '</span>'),
                  this['ui']['pageMode']['attr']('title', this['options']['text']['singlePageMode']),
                  this['target']['pageMode'] = _0xb07ax3['PAGE_MODE']['DOUBLE']),
                  this['target'] && this['target']['singlePageMode'] == _0xb07ax3['SINGLE_PAGE_MODE']['BOOKLET'] && this['target']['reset'](),
                  this['resize']()
              },
              setAutoPlay: function(_0xb07ax3) {
                  if (this['options']['autoPlay']) {
                      var _0xb07ax4 = (_0xb07ax3 = 1 == _0xb07ax3) ? this['options']['text']['pause'] : this['options']['text']['play'];
                      this['ui']['play']['toggleClass'](this['options']['icons']['pause'], _0xb07ax3),
                      this['ui']['play']['html']('<span>' + _0xb07ax4 + '</span>'),
                      this['ui']['play']['attr']('title', _0xb07ax4),
                      clearInterval(this['autoPlayTimer']),
                      _0xb07ax3 && (this['autoPlayTimer'] = setInterval(this['autoPlayFunction'], this['options']['autoPlayDuration'])),
                      this['target']['autoPlay'] = _0xb07ax3
                  }
              },
              height: function(_0xb07ax3) {
                  if (null == _0xb07ax3) {
                      return this['container']['height']()
                  }
                  ;this['options']['height'] = _0xb07ax3,
                  this['container']['height'](_0xb07ax3),
                  this['resize']()
              },
              checkCenter: function(_0xb07ax4) {
                  _0xb07ax4 = null == _0xb07ax4 ? {} : _0xb07ax4,
                  this['centerType'] = this['centerType'] || 'start';
                  var _0xb07ax5, _0xb07ax6 = this['target'], _0xb07ax7 = 0, _0xb07ax8 = 0, _0xb07ax9 = 0, _0xb07axa = _0xb07axd['getBasePage'](_0xb07ax6._activePage), _0xb07axb = _0xb07ax6['_activePage'] % 2 == 0, _0xb07axc = _0xb07ax6['direction'] == _0xb07ax3['DIRECTION']['RTL'], _0xb07axe = _0xb07ax6['pageMode'] == _0xb07ax3['PAGE_MODE']['SINGLE'], _0xb07axf = _0xb07axe && _0xb07ax6['singlePageMode'] == _0xb07ax3['SINGLE_PAGE_MODE']['BOOKLET'], _0xb07ax10 = _0xb07ax6['stage']['width']();
                  if ('css' == _0xb07ax6['mode']) {
                      _0xb07ax5 = _0xb07ax6['wrapper']['width'](),
                      _0xb07ax7 = Math['max']((_0xb07ax5 - _0xb07ax10) / 2, 0),
                      _0xb07ax8 = -_0xb07ax5 / 4,
                      _0xb07ax9 = _0xb07ax5 / 4,
                      0 == _0xb07axa || _0xb07axf ? (_0xb07ax6['wrapper']['css']({
                          left: _0xb07axe ? _0xb07axc ? _0xb07ax9 - _0xb07ax7 : _0xb07ax8 - _0xb07ax7 : _0xb07axc ? _0xb07ax9 : _0xb07ax8
                      }),
                      _0xb07ax6['shadow']['css']({
                          width: '50%',
                          left: _0xb07axc ? 0 : '50%',
                          transitionDelay: ''
                      })) : _0xb07axa == _0xb07ax6['pageCount'] ? (_0xb07ax6['wrapper']['css']({
                          left: _0xb07axe ? _0xb07axc ? _0xb07ax8 - _0xb07ax7 : _0xb07ax9 - _0xb07ax7 : _0xb07axc ? _0xb07ax8 : _0xb07ax9
                      }),
                      _0xb07ax6['shadow']['css']({
                          width: '50%',
                          left: _0xb07axc ? '50%' : 0,
                          transitionDelay: ''
                      })) : (_0xb07ax6['wrapper']['css']({
                          left: _0xb07axe ? _0xb07axc ? _0xb07axb ? _0xb07ax8 - _0xb07ax7 : _0xb07ax9 - _0xb07ax7 : _0xb07axb ? _0xb07ax9 - _0xb07ax7 : _0xb07ax8 - _0xb07ax7 : 0
                      }),
                      _0xb07ax6['shadow']['css']({
                          width: '100%',
                          left: 0,
                          transitionDelay: parseInt(_0xb07ax6['duration'], 10) + 50 + 'ms'
                      })),
                      _0xb07ax6['wrapper']['css']({
                          transition: 'resize' == _0xb07ax4['type'] ? 'none' : ''
                      })
                  } else {
                      if (null != _0xb07ax6['stage']) {
                          var _0xb07ax11, _0xb07ax12 = _0xb07ax6['position']['x'];
                          _0xb07ax7 = _0xb07ax6['width'] / 4,
                          _0xb07ax8 = -(_0xb07ax5 = _0xb07ax6['width']) / 2,
                          _0xb07ax9 = _0xb07ax5 / 2,
                          (_0xb07ax11 = 0 == _0xb07axa || _0xb07axf ? _0xb07axc ? _0xb07ax9 : _0xb07ax8 : _0xb07axa == _0xb07ax6['pageCount'] ? _0xb07axc ? _0xb07ax8 : _0xb07ax9 : _0xb07axe ? _0xb07axc ? _0xb07axb ? _0xb07ax8 : _0xb07ax9 : _0xb07axb ? _0xb07ax9 : _0xb07ax8 : 0) !== this['centerEnd'] && (this['centerTween'] = new TWEEN.Tween({
                              x: _0xb07ax12
                          })['delay'](0)['to']({
                              x: _0xb07ax11
                          }, _0xb07ax6['duration'])['onUpdate'](function() {
                              _0xb07ax6['position']['x'] = this['x'],
                              _0xb07ax6['stage']['cssScene']['position']['x'] = this['x']
                          })['easing'](_0xb07ax6['ease'])['start'](),
                          this['centerEnd'] = _0xb07ax11)
                      }
                  }
              },
              width: function(_0xb07ax3) {
                  if (null == _0xb07ax3) {
                      return this['container']['width']()
                  }
                  ;this['options']['width'] = _0xb07ax3,
                  this['container']['width'](_0xb07ax3),
                  this['resize']()
              }
          },
          _0xb07ax6
      }();
      _0xb07ax3['PreviewObject'] = _0xb07ax2d;
      var _0xb07ax2e = function(_0xb07ax5) {
          function _0xb07ax6(_0xb07ax5, _0xb07ax6, _0xb07ax7, _0xb07ax8) {
              _0xb07ax7 = _0xb07ax7 || {};
              var _0xb07axa = this;
              if (_0xb07axa['contentRawSource'] = _0xb07ax5 || [_0xb07ax9['textureLoadFallback']],
              _0xb07axa['contentSource'] = _0xb07axa['contentRawSource'],
              _0xb07axa['contentSourceType'] = null,
              _0xb07axa['minDimension'] = _0xb07ax7['minTextureSize'] || 256,
              _0xb07axa['maxDimension'] = _0xb07ax7['maxTextureSize'] || 2048,
              _0xb07axa['pdfRenderQuality'] = _0xb07ax7['pdfRenderQuality'] || _0xb07ax3['defaults']['pdfRenderQuality'],
              _0xb07axa['flipbook'] = _0xb07ax8,
              _0xb07axa['waitPeriod'] = 50,
              _0xb07axa['maxLength'] = 297,
              _0xb07axa['enableDebug'] = !1,
              _0xb07axa['zoomScale'] = 1,
              _0xb07axa['maxZoom'] = 2,
              _0xb07axa['options'] = _0xb07ax7,
              _0xb07axa['outline'] = _0xb07ax7['outline'],
              _0xb07axa['links'] = _0xb07ax7['links'],
              _0xb07axa['html'] = _0xb07ax7['html'],
              _0xb07axa['isCrossOrigin'] = _0xb07ax7['isCrossOrigin'],
              _0xb07axa['normalViewport'] = {
                  height: 297,
                  width: 210,
                  scale: 1
              },
              _0xb07axa['viewport'] = {
                  height: 297,
                  width: 210,
                  scale: 1
              },
              _0xb07axa['imageViewport'] = {
                  height: 297,
                  width: 210,
                  scale: 1
              },
              _0xb07axa['bookSize'] = {
                  height: 297,
                  width: 210
              },
              _0xb07axa['zoomViewport'] = {
                  height: 297,
                  width: 210
              },
              _0xb07axa['thumbsize'] = 128,
              _0xb07axa['cacheIndex'] = 256,
              _0xb07axa['cache'] = [],
              _0xb07axa['pageRatio'] = _0xb07ax7['pageRatio'] || _0xb07axa['viewport']['width'] / _0xb07axa['viewport']['height'],
              _0xb07axa['textureLoadTimeOut'] = null,
              _0xb07axa['type'] = 'TextureLibrary',
              Array === _0xb07axa['contentSource']['constructor'] || Array['isArray'](_0xb07axa['contentSource']) || _0xb07axa['contentSource']instanceof Array) {
                  _0xb07axa['contentSourceType'] = _0xb07axe['IMAGE'],
                  _0xb07axa['pageCount'] = _0xb07axa['contentSource']['length'],
                  _0xb07ax4('<img/>')['attr']('src', _0xb07axa['contentSource'][0])['on']('load', function() {
                      _0xb07axa['viewport']['height'] = this['height'],
                      _0xb07axa['viewport']['width'] = this['width'],
                      _0xb07axa['pageRatio'] = _0xb07axa['viewport']['width'] / _0xb07axa['viewport']['height'],
                      _0xb07axa['bookSize'] = {
                          width: (_0xb07axa['pageRatio'] > 1 ? 1 : _0xb07axa['pageRatio']) * _0xb07axa['maxLength'],
                          height: _0xb07axa['maxLength'] / (_0xb07axa['pageRatio'] < 1 ? 1 : _0xb07axa['pageRatio'])
                      },
                      _0xb07axa['zoomViewport'] = {
                          width: (_0xb07axa['pageRatio'] > 1 ? 1 : _0xb07axa['pageRatio']) * _0xb07axa['maxDimension'],
                          height: _0xb07axa['maxDimension'] / (_0xb07axa['pageRatio'] < 1 ? 1 : _0xb07axa['pageRatio'])
                      },
                      _0xb07axa['linkService'] = new PDFLinkService,
                      _0xb07ax4(this)['off'](),
                      _0xb07axa['options']['pageSize'] == _0xb07ax3['PAGE_SIZE']['DOUBLEINTERNAL'] && (_0xb07axa['pageCount'] = 2 * _0xb07axa['contentSource']['length'] - 2,
                      1 == _0xb07axa['options']['webgl'] && (_0xb07axa['requiresImageTextureScaling'] = !0)),
                      null != _0xb07ax6 && (_0xb07ax6(_0xb07axa),
                      _0xb07ax6 = null),
                      _0xb07ax1c(this['height'] + ':' + this['width'])
                  })
              } else {
                  if ('string' == typeof _0xb07axa['contentSource'] || _0xb07axa['contentSource']instanceof String) {
                      var _0xb07axb = function() {
                          if (_0xb07axa) {
                              PDFJS['workerSrc'] = _0xb07ax9['pdfjsWorkerSrc'],
                              _0xb07axa['contentSourceType'] = _0xb07axe['PDF'],
                              PDFJS['disableAutoFetch'] = !0,
                              PDFJS['disableStream'] = !0,
                              (_0xb07ax27 || _0xb07ax28 || 1 == _0xb07axa['options']['disableFontFace']) && (PDFJS['disableFontFace'] = _0xb07ax27 || _0xb07ax28 || 1 == _0xb07axa['options']['disableFontFace']),
                              PDFJS['imageResourcesPath'] = _0xb07ax9['imageResourcesPath'],
                              PDFJS['cMapUrl'] = _0xb07ax9['cMapUrl'],
                              PDFJS['cMapPacked'] = !0,
                              PDFJS['externalLinkTarget'] = PDFJS['LinkTarget']['BLANK'];
                              var _0xb07ax4 = _0xb07axa['loading'] = PDFJS['getDocument'](_0xb07axa['options']['docParameters'] ? _0xb07axa['options']['docParameters'] : {
                                  url: _0xb07axd['httpsCorrection'](_0xb07ax5),
                                  rangeChunkSize: isNaN(_0xb07ax3['defaults']['rangeChunkSize']) ? 524288 : _0xb07ax3['defaults']['rangeChunkSize']
                              });
                              _0xb07ax4['then'](function(_0xb07ax4) {
                                  _0xb07axa['pdfDocument'] = _0xb07ax4,
                                  _0xb07ax4['getPage'](1)['then'](function(_0xb07ax5) {
                                      _0xb07axa['normalViewport'] = _0xb07ax5['getViewport'](1),
                                      _0xb07axa['viewport'] = _0xb07ax5['getViewport'](1),
                                      _0xb07axa['viewport']['height'] = _0xb07axa['viewport']['height'] / 10,
                                      _0xb07axa['viewport']['width'] = _0xb07axa['viewport']['width'] / 10,
                                      _0xb07axa['pageRatio'] = _0xb07axa['viewport']['width'] / _0xb07axa['viewport']['height'],
                                      _0xb07axa['bookSize'] = {
                                          width: (_0xb07axa['pageRatio'] > 1 ? 1 : _0xb07axa['pageRatio']) * _0xb07axa['maxLength'],
                                          height: _0xb07axa['maxLength'] / (_0xb07axa['pageRatio'] < 1 ? 1 : _0xb07axa['pageRatio'])
                                      },
                                      _0xb07axa['zoomViewport'] = {
                                          width: (_0xb07axa['pageRatio'] > 1 ? 1 : _0xb07axa['pageRatio']) * _0xb07axa['maxDimension'],
                                          height: _0xb07axa['maxDimension'] / (_0xb07axa['pageRatio'] < 1 ? 1 : _0xb07axa['pageRatio'])
                                      },
                                      _0xb07axa['refPage'] = _0xb07ax5,
                                      _0xb07ax4['numPages'] > 1 ? _0xb07ax4['getPage'](2)['then'](function(_0xb07ax5) {
                                          if (_0xb07axa['options']['pageSize'] == _0xb07ax3['PAGE_SIZE']['AUTO']) {
                                              var _0xb07ax7 = _0xb07ax5['getViewport'](1);
                                              _0xb07ax7['width'] / _0xb07ax7['height'] > 1.5 * _0xb07axa['pageRatio'] ? (_0xb07axa['options']['pageSize'] = _0xb07ax3['PAGE_SIZE']['DOUBLEINTERNAL'],
                                              _0xb07axa['pageCount'] = 2 * _0xb07ax4['numPages'] - 2) : _0xb07axa['options']['pageSize'] = _0xb07ax3['PAGE_SIZE']['SINGLE']
                                          }
                                          ;null != _0xb07ax6 && (_0xb07ax6(_0xb07axa),
                                          _0xb07ax6 = null)
                                      }) : null != _0xb07ax6 && (_0xb07ax6(_0xb07axa),
                                      _0xb07ax6 = null)
                                  }),
                                  _0xb07axa['linkService'] = new PDFLinkService,
                                  _0xb07axa['linkService']['setDocument'](_0xb07ax4, null),
                                  _0xb07axa['pageCount'] = _0xb07ax4['numPages'],
                                  _0xb07axa['contentSource'] = _0xb07ax4
                              }, function(_0xb07ax3) {
                                  if (_0xb07axa) {
                                      var _0xb07ax4 = ''
                                        , _0xb07ax5 = document['createElement']('a');
                                      _0xb07ax5['href'] = _0xb07axa['contentSource'],
                                      _0xb07ax5['hostname'] !== window['location']['hostname'] && (_0xb07ax4 = 'CROSS ORIGIN!! '),
                                      _0xb07axa['updateInfo'](_0xb07ax4 + 'Error Loading File -  ' + _0xb07axa['contentSource'])
                                  }
                              }),
                              _0xb07ax4['onProgress'] = function(_0xb07ax3) {
                                  if (_0xb07axa) {
                                      var _0xb07ax4 = 100 * _0xb07ax3['loaded'] / _0xb07ax3['total'];
                                      isNaN(_0xb07ax4) ? _0xb07ax3 && _0xb07ax3['loaded'] ? _0xb07axa['updateInfo']('Loading Pages ' + (Math['ceil'](_0xb07ax3['loaded'] / 1e4) / 100).toString() + 'MB ...') : _0xb07axa['updateInfo']('Loading Pages ...') : _0xb07axa['updateInfo']('Loading Pages ' + _0xb07ax4.toString()['split']('.')[0] + '% ...')
                                  }
                              }
                          }
                      }
                        , _0xb07axc = function() {
                          if (_0xb07axa) {
                              _0xb07ax9['pdfjsWorkerSrc'] += '?ver=' + _0xb07ax3['version'],
                              _0xb07axa['updateInfo']('Loading Interface ...');
                              var _0xb07ax5 = document['createElement']('a');
                              _0xb07ax5['href'] = _0xb07ax9['pdfjsWorkerSrc'],
                              _0xb07ax5['hostname'] !== window['location']['hostname'] ? (_0xb07axa['updateInfo']('Loading Interface ...'),
                              _0xb07ax4['ajax']({
                                  url: _0xb07ax9['pdfjsWorkerSrc'],
                                  cache: !0,
                                  success: function(_0xb07ax4) {
                                      _0xb07ax9['pdfjsWorkerSrc'] = _0xb07ax3['createObjectURL'](_0xb07ax4, 'text/javascript'),
                                      _0xb07axb()
                                  }
                              })) : _0xb07axb()
                          }
                      };
                      null == window['PDFJS'] ? _0xb07axa && (_0xb07axa['updateInfo']('Loading Interface ...'),
                      _0xb07ax20(_0xb07ax9['pdfjsSrc'] + '?ver=' + _0xb07ax3['version'], function() {
                          'function' == typeof define && define['amd'] ? (_0xb07axa['updateInfo']('Loading Interface ...'),
                          require['config']({
                              paths: {
                                  "\x70\x64\x66\x6A\x73\x2D\x64\x69\x73\x74\x2F\x62\x75\x69\x6C\x64\x2F\x70\x64\x66\x2E\x77\x6F\x72\x6B\x65\x72": _0xb07ax9['pdfjsWorkerSrc']['replace']('.js', '')
                              }
                          }),
                          require(['pdfjs-dist/build/pdf'], function(_0xb07ax3) {
                              _0xb07axc()
                          })) : _0xb07axc()
                      }, function() {
                          _0xb07axa['updateInfo']('Unable to load Interface ..')
                      })) : _0xb07axb()
                  } else {
                      console['error']('Unsupported source type. Please load a valid PDF file.')
                  }
              }
              ;return this['dispose'] = function() {
                  _0xb07axa['loading'] && _0xb07axa['loading']['destroy'] && _0xb07axa['loading']['destroy'](),
                  _0xb07axa['loading'] = null,
                  _0xb07axa['textureLoadTimeOut'] && (clearTimeout(_0xb07axa['textureLoadTimeOut']),
                  _0xb07axa['textureLoadTimeOut'] = null),
                  this['targetObject'] && (this['targetObject']['thumbContainer'] && this['targetObject']['thumbContainer']['remove'] && this['targetObject']['thumbContainer']['remove'](),
                  this['targetObject']['outlineContainer'] && this['targetObject']['outlineContainer']['remove'] && this['targetObject']['outlineContainer']['remove'](),
                  this['targetObject']['dispose'] && this['targetObject']['dispose'](),
                  this['targetObject']['processPage'] = null,
                  this['targetObject']['requestPage'] = null,
                  this['targetObject']['container'] && this['targetObject']['container']['off'] && this['targetObject']['container']['off']()),
                  this['pdfDocument'] && this['pdfDocument']['destroy'] && this['pdfDocument']['destroy'](),
                  this['linkService'] && this['linkService']['dispose'] && this['linkService']['dispose'](),
                  this['outlineViewer'] && this['outlineViewer']['dispose'] && this['outlineViewer']['dispose'](),
                  this['thumblist'] && this['thumblist']['dispose'] && (this['thumblist']['review'] = null,
                  this['thumblist']['dispose']()),
                  this['activeThumb'] = null,
                  this['targetObject'] = null,
                  this['pdfDocument'] = null,
                  this['linkService'] = null,
                  this['outlineViewer'] = null,
                  this['thumblist'] = null,
                  _0xb07axa = null
              }
              ,
              this
          }
          return _0xb07ax29(_0xb07ax6, {}),
          _0xb07ax6['prototype']['updateInfo'] = function(_0xb07ax3) {
              this['flipbook'] && this['flipbook']['updateInfo'] && this['flipbook']['updateInfo'](_0xb07ax3)
          }
          ,
          _0xb07ax6['prototype']['initThumbs'] = function() {
              var _0xb07ax3, _0xb07ax5 = this;
              null == _0xb07ax5['cache'][_0xb07ax5['thumbsize']] && (_0xb07ax5['cache'][_0xb07ax5['thumbsize']] = []);
              var _0xb07ax6 = function() {
                  clearTimeout(_0xb07ax3),
                  _0xb07ax3 = setTimeout(function() {
                      _0xb07ax3 = setTimeout(_0xb07ax7, _0xb07ax5['waitPeriod'] / 2)
                  }, _0xb07ax5['waitPeriod'])
              }
                , _0xb07ax7 = function() {
                  var _0xb07ax7 = 0;
                  if ((Date['now']() - _0xb07ax5['thumblist']['lastScrolled'] < 100 ? _0xb07ax7 = 1 : (_0xb07ax5['targetObject']['container']['find']('.pdff-thumb-container .pdff-vrow')['each'](function() {
                      var _0xb07ax3 = _0xb07ax4(this);
                      if (!_0xb07ax3['hasClass']('pdff-thumb-loaded')) {
                          _0xb07ax7++;
                          var _0xb07ax8 = _0xb07ax4(this)['attr']('id')['replace']('pdff-thumb', '');
                          return _0xb07ax5['getPage'](_0xb07ax8, _0xb07ax6, !0),
                          _0xb07ax3['addClass']('pdff-thumb-loaded'),
                          !1
                      }
                  }),
                  0 == _0xb07ax7 && clearTimeout(_0xb07ax3)),
                  _0xb07ax7 > 0 && _0xb07ax6(),
                  _0xb07ax5['activeThumb'] != _0xb07ax5['targetObject']['_activePage']) && (null != _0xb07ax5['targetObject']['thumbContainer'] && _0xb07ax5['targetObject']['thumbContainer']['hasClass']('pdff-sidemenu-visible'))) {
                      var _0xb07ax8 = _0xb07ax5['thumblist']['container']
                        , _0xb07ax9 = _0xb07ax8['scrollTop']
                        , _0xb07axa = _0xb07ax8['getBoundingClientRect']()['height']
                        , _0xb07axb = _0xb07ax5['targetObject']['thumbContainer']['find']('#pdff-thumb' + _0xb07ax5['targetObject']['_activePage']);
                      _0xb07axb['length'] > 0 ? (_0xb07ax5['targetObject']['thumbContainer']['find']('.pdff-selected')['removeClass']('pdff-selected'),
                      _0xb07axb['addClass']('pdff-selected'),
                      _0xb07ax9 + _0xb07axa < (_0xb07axb = _0xb07axb[0])['offsetTop'] + _0xb07axb['scrollHeight'] ? _0xb07axb['scrollIntoView'](!1) : _0xb07ax9 > _0xb07axb['offsetTop'] && _0xb07axb['scrollIntoView'](),
                      _0xb07ax5['activeThumb'] = _0xb07ax5['targetObject']['_activePage']) : (_0xb07ax4(_0xb07ax8)['scrollTop'](124 * _0xb07ax5['targetObject']['_activePage']),
                      _0xb07ax6())
                  }
              };
              _0xb07ax5['thumblist'] = _0xb07ax5['targetObject']['thumblist'] = new ThumbList({
                  h: 500,
                  addFn: function(_0xb07ax3) {},
                  scrollFn: _0xb07ax6,
                  itemHeight: 128,
                  totalRows: _0xb07ax5['pageCount'],
                  generatorFn: function(_0xb07ax3) {
                      var _0xb07ax4 = document['createElement']('div')
                        , _0xb07ax5 = _0xb07ax3 + 1;
                      _0xb07ax4['id'] = 'pdff-thumb' + _0xb07ax5;
                      var _0xb07ax6 = document['createElement']('div');
                      return _0xb07ax6['innerHTML'] = _0xb07ax5,
                      _0xb07ax4['appendChild'](_0xb07ax6),
                      _0xb07ax4
                  }
              }),
              _0xb07ax5['thumblist']['lastScrolled'] = Date['now'](),
              _0xb07ax5['thumblist']['review'] = _0xb07ax6,
              _0xb07ax6();
              var _0xb07ax8 = _0xb07ax4('<div>')['addClass']('pdff-thumb-container pdff-sidemenu-visible pdff-sidemenu');
              _0xb07ax8['append'](_0xb07ax4(_0xb07ax5['thumblist']['container'])['addClass']('pdff-thumb-wrapper')),
              _0xb07ax5['targetObject']['thumbContainer'] = _0xb07ax8,
              _0xb07ax5['targetObject']['container']['append'](_0xb07ax8);
              var _0xb07ax9 = _0xb07ax4(_0xb07ax11['div'], {
                  class: 'pdff-ui-btn pdff-ui-sidemenu-close ti-close'
              });
              _0xb07ax8['append'](_0xb07ax9),
              _0xb07ax5['thumblist']['reset'](_0xb07ax4(_0xb07ax5['thumblist']['container'])['height']()),
              _0xb07ax5['targetObject']['container']['on']('click', '.pdff-thumb-container .pdff-vrow', function(_0xb07ax3) {
                  _0xb07ax3['stopPropagation']();
                  var _0xb07ax6 = _0xb07ax4(this)['attr']('id')['replace']('pdff-thumb', '');
                  _0xb07ax5['targetObject']['gotoPage'](parseInt(_0xb07ax6, 10))
              })
          }
          ,
          _0xb07ax6['prototype']['initOutline'] = function() {
              var _0xb07ax3 = this
                , _0xb07ax5 = _0xb07ax4('<div>')['addClass']('pdff-outline-container pdff-sidemenu')
                , _0xb07ax6 = _0xb07ax4('<div>')['addClass']('pdff-outline-wrapper')
                , _0xb07ax7 = _0xb07ax4(_0xb07ax11['div'], {
                  class: 'pdff-ui-btn pdff-ui-sidemenu-close ti-close'
              });

              function _0xb07ax8(_0xb07ax4) {
                  if (1 == _0xb07ax3['options']['overwritePDFOutline'] && (_0xb07ax4 = []),
                  _0xb07ax4 = _0xb07ax4 || [],
                  _0xb07ax3['outline']) {
                      for (var _0xb07ax5 = 0; _0xb07ax5 < _0xb07ax3['outline']['length']; _0xb07ax5++) {
                          _0xb07ax3['outline'][_0xb07ax5]['custom'] = !0,
                          _0xb07ax4 && _0xb07ax4['push'](_0xb07ax3['outline'][_0xb07ax5])
                      }
                  }
                  ;_0xb07ax3['outlineViewer']['render']({
                      outline: _0xb07ax4
                  })
              }
              _0xb07ax5['append'](_0xb07ax7)['append'](_0xb07ax6),
              _0xb07ax3['targetObject']['container']['append'](_0xb07ax5),
              _0xb07ax3['targetObject']['outlineContainer'] = _0xb07ax5,
              _0xb07ax3['outlineViewer'] = new BookMarkViewer({
                  container: _0xb07ax6[0],
                  linkService: _0xb07ax3['linkService'],
                  outlineItemClass: 'pdff-outline-item',
                  outlineToggleClass: 'pdff-outline-toggle',
                  outlineToggleHiddenClass: 'pdff-outlines-hidden'
              }),
              _0xb07ax3['pdfDocument'] ? _0xb07ax3['pdfDocument']['getOutline']()['then'](function(_0xb07ax3) {
                  _0xb07ax8(_0xb07ax3)
              }) : _0xb07ax8([]),
              1 == _0xb07ax3['options']['autoEnableOutline'] && _0xb07ax3['targetObject']['ui']['outline']['trigger']('click'),
              1 == _0xb07ax3['options']['autoEnableThumbnail'] && _0xb07ax3['targetObject']['ui']['thumbnail']['trigger']('click')
          }
          ,
          _0xb07ax6['prototype']['checkViewportSize'] = function(_0xb07ax3, _0xb07ax4, _0xb07ax5) {
              var _0xb07ax6 = this
                , _0xb07ax7 = _0xb07ax6['targetObject']
                , _0xb07ax8 = _0xb07ax3 * _0xb07ax5
                , _0xb07axa = _0xb07ax4 * _0xb07ax5
                , _0xb07axb = _0xb07ax6['cacheIndex'];
              if (_0xb07ax6['contentSourceType'] == _0xb07axe['PDF']) {
                  if (_0xb07ax6['cacheIndex'] = Math['ceil'](Math['max'](_0xb07ax8, _0xb07axa)),
                  _0xb07ax6['cacheIndex'] = Math['floor'](Math['max'](_0xb07ax8, _0xb07axa)),
                  _0xb07ax6['cacheIndex'] = _0xb07ax18(_0xb07ax6['cacheIndex'] * _0xb07ax9['pixelRatio'], _0xb07ax6['minDimension'], _0xb07ax6['maxDimension']),
                  null == _0xb07ax6['cache'][_0xb07ax6['cacheIndex']] && (_0xb07ax6['cache'][_0xb07ax6['cacheIndex']] = []),
                  _0xb07axb !== _0xb07ax6['cacheIndex']) {
                      for (var _0xb07axc = 0; _0xb07axc < _0xb07ax7['children']['length']; _0xb07axc++) {
                          _0xb07ax7['children'][_0xb07axc]
                      }
                      ;_0xb07ax7['refresh']()
                  }
                  ;_0xb07ax6['imageViewport'] = _0xb07ax6['refPage']['getViewport'](_0xb07axa / _0xb07ax6['normalViewport']['height']),
                  _0xb07ax6['viewport'] = 'css' == _0xb07ax7['mode'] ? _0xb07ax6['imageViewport'] : _0xb07ax6['refPage']['getViewport'](_0xb07ax6['bookSize']['height'] / _0xb07ax6['normalViewport']['height']),
                  _0xb07ax1c(_0xb07ax6['cacheIndex']);
                  var _0xb07axd = _0xb07ax7['container']['find']('.linkAnnotation')
                    , _0xb07axf = _0xb07ax6['viewport']['clone']({
                      dontFlip: !0
                  });
                  _0xb07axd['css']({
                      transform: 'matrix(' + _0xb07axf['transform']['join'](',') + ')'
                  })
              } else {
                  null == _0xb07ax6['cache'][_0xb07ax6['cacheIndex']] && (_0xb07ax6['cache'][_0xb07ax6['cacheIndex']] = [])
              }
          }
          ,
          _0xb07ax6['prototype']['getCache'] = function(_0xb07ax3, _0xb07ax4) {
              return 1 == _0xb07ax4 ? null == this['cache'][this['thumbsize']] ? null : this['cache'][this['thumbsize']][_0xb07ax3] : null == this['cache'][this['cacheIndex']] ? null : this['cache'][this['cacheIndex']][_0xb07ax3]
          }
          ,
          _0xb07ax6['prototype']['setCache'] = function(_0xb07ax3, _0xb07ax4, _0xb07ax5, _0xb07ax6) {
              if (1 == _0xb07ax5) {
                  null != this['cache'][this['thumbsize']] && (this['cache'][this['thumbsize']][_0xb07ax3] = _0xb07ax4)
              } else {
                  var _0xb07ax7 = null == _0xb07ax6 ? this['cacheIndex'] : _0xb07ax6;
                  null != this['cache'][_0xb07ax7] && (this['cache'][_0xb07ax7][_0xb07ax3] = _0xb07ax4)
              }
          }
          ,
          _0xb07ax6['prototype']['setTarget'] = function(_0xb07ax3) {
              var _0xb07ax4 = this;
              if (null == _0xb07ax3) {
                  return this['targetObject']
              }
              ;this['targetObject'] = _0xb07ax3,
              _0xb07ax3['contentProvider'] = this,
              _0xb07ax3['container']['removeClass']('pdff-loading pdff-init'),
              null != _0xb07ax4['linkService'] && (_0xb07ax4['linkService']['setViewer'](_0xb07ax3),
              _0xb07ax4['initOutline']()),
              _0xb07ax3['processPage'] = function(_0xb07ax3, _0xb07ax5) {
                  _0xb07ax3 > 0 && _0xb07ax3 <= _0xb07ax4['pageCount'] ? _0xb07ax4['getPage'](_0xb07ax3, _0xb07ax5) : _0xb07ax4['setPage'](_0xb07ax3, _0xb07ax9['textureLoadFallback'], _0xb07ax5)
              }
              ,
              _0xb07ax3['requestPage'] = function() {
                  _0xb07ax4['review']('Request')
              }
              ,
              null != _0xb07ax3['resize'] && _0xb07ax3['resize']()
          }
          ,
          _0xb07ax6['prototype']['review'] = function(_0xb07ax3) {
              var _0xb07ax4 = this;
              _0xb07ax3 = _0xb07ax3 || 'timer review',
              clearTimeout(_0xb07ax4['textureLoadTimeOut']),
              _0xb07ax4['textureLoadTimeOut'] = setTimeout(function() {
                  _0xb07ax4['textureLoadTimeOut'] = setTimeout(_0xb07ax4['reviewPages'], _0xb07ax4['waitPeriod'] / 2, _0xb07ax4, _0xb07ax3)
              }, _0xb07ax4['waitPeriod'])
          }
          ,
          _0xb07ax6['prototype']['reviewPages'] = function(_0xb07ax3, _0xb07ax5) {
              var _0xb07ax6 = (_0xb07ax3 = _0xb07ax3 || this)['targetObject'];
              if (null != _0xb07ax6) {
                  var _0xb07ax7 = _0xb07ax23(_0xb07ax6);
                  null != _0xb07ax5 && _0xb07ax1c(_0xb07ax5);
                  var _0xb07ax8, _0xb07ax9 = !1;
                  for (_0xb07ax8 = 0; _0xb07ax8 < _0xb07ax3['targetObject']['children']['length']; _0xb07ax8++) {
                      if (1 == _0xb07ax6['children'][_0xb07ax8]['isFlipping']) {
                          _0xb07ax9 = !0;
                          break
                      }
                  }
                  ;if (0 == _0xb07ax9) {
                      var _0xb07axa = _0xb07ax6['children']['length'] > 3 ? 3 : _0xb07ax6['children']['length']
                        , _0xb07axb = _0xb07ax7 ? _0xb07ax6['_activePage'] : _0xb07ax1f(_0xb07ax6._activePage);
                      for (_0xb07ax3['baseNumber'] = _0xb07axb,
                      _0xb07ax3['zoomScale'] > 1 && (_0xb07axa = 1),
                      _0xb07ax8 = 0; _0xb07ax8 < _0xb07axa; _0xb07ax8++) {
                          var _0xb07axc = Math['floor'](_0xb07ax8 / 2)
                            , _0xb07axd = _0xb07ax8 % 2 == 0 ? -_0xb07axc * (_0xb07ax7 ? 1 : 2) : (0 == _0xb07axc ? 1 : _0xb07axc) * (_0xb07ax7 ? 1 : 2)
                            , _0xb07axe = _0xb07axb + _0xb07axd
                            , _0xb07axf = _0xb07axb + _0xb07axd + 1
                            , _0xb07ax10 = _0xb07ax6['getPageByNumber'](_0xb07axe)
                            , _0xb07ax11 = _0xb07ax6['getPageByNumber'](_0xb07axf)
                            , _0xb07ax12 = _0xb07axe + '|' + _0xb07ax3['cacheIndex']
                            , _0xb07ax13 = _0xb07axf + '|' + _0xb07ax3['cacheIndex']
                            , _0xb07ax14 = 0;
                          if (null != _0xb07ax10 && _0xb07ax10['frontPageStamp'] != _0xb07ax12 && 1 == _0xb07ax10['visible'] && (_0xb07ax10['frontTextureLoaded'] = !1,
                          _0xb07ax6['processPage'](_0xb07axe, function() {
                              _0xb07ax3['review']('Batch Call')
                          }),
                          _0xb07ax10['frontPageStamp'] = _0xb07ax12,
                          _0xb07ax14++),
                          null == _0xb07ax11 || _0xb07ax11['backPageStamp'] == _0xb07ax13 || 1 != _0xb07ax11['visible'] || _0xb07ax7 || (_0xb07ax11['backTextureLoaded'] = !1,
                          _0xb07ax6['processPage'](_0xb07axf, function() {
                              _0xb07ax3['review']('Batch Call')
                          }),
                          _0xb07ax11['backPageStamp'] = _0xb07ax13,
                          _0xb07ax14++),
                          0 == _0xb07axd && _0xb07ax3['annotedPage'] !== _0xb07axb && (_0xb07ax3['getAnnotations'](_0xb07axe),
                          _0xb07ax7 || _0xb07ax3['getAnnotations'](_0xb07axf),
                          _0xb07ax3['annotedPage'] = _0xb07axb),
                          _0xb07ax14 > 0) {
                              break
                          }
                      }
                      ;0 == _0xb07ax14 && 'css' !== _0xb07ax6['mode'] && _0xb07ax3['setLoading'](_0xb07axb)
                  } else {
                      if (_0xb07ax3['review']('Revisit request'),
                      null != _0xb07ax3['annotedPage'] && 'css' !== _0xb07ax6['mode']) {
                          var _0xb07ax15 = _0xb07ax1f(_0xb07ax6._activePage);
                          _0xb07ax4(_0xb07ax6['getContentLayer'](_0xb07ax15))['html'](''),
                          _0xb07ax4(_0xb07ax6['getContentLayer'](_0xb07ax15 + 1))['html'](''),
                          _0xb07ax3['annotedPage'] = null
                      }
                  }
              }
          }
          ,
          _0xb07ax6['prototype']['getPage'] = function(_0xb07ax4, _0xb07ax5, _0xb07ax6) {
              var _0xb07ax7, _0xb07ax8, _0xb07axa, _0xb07axb, _0xb07axc = this, _0xb07axd = _0xb07ax4 = parseInt(_0xb07ax4, 10), _0xb07axf = _0xb07axc['contentSource'];
              _0xb07ax4 <= 0 && _0xb07ax4 >= _0xb07axc['pageCount'] ? _0xb07axc['setPage'](_0xb07ax4, _0xb07ax9['textureLoadFallback'], _0xb07ax5, _0xb07ax6) : _0xb07axc['contentSourceType'] == _0xb07axe['PDF'] ? null != _0xb07axc['getCache'](_0xb07ax4, _0xb07ax6) ? (_0xb07axc['setPage'](_0xb07ax4, _0xb07axc['getCache'](_0xb07ax4, _0xb07ax6), _0xb07ax5, _0xb07ax6),
              _0xb07ax1c('Page ' + _0xb07ax4 + ' loaded from cache')) : (!0 !== _0xb07ax6 && _0xb07axc['setLoading'](_0xb07ax4, !0),
              _0xb07axc['options']['pageSize'] == _0xb07ax3['PAGE_SIZE']['DOUBLEINTERNAL'] && _0xb07ax4 > 2 && (_0xb07axd = Math['ceil']((_0xb07ax4 - 1) / 2) + 1),
              _0xb07axf['getPage'](_0xb07axd, _0xb07ax6)['then'](function(_0xb07ax7) {
                  !function(_0xb07ax4, _0xb07ax5, _0xb07ax6, _0xb07ax7) {
                      var _0xb07ax8 = _0xb07axc['options']['forceFit']
                        , _0xb07ax9 = _0xb07axc['options']['pageSize'] == _0xb07ax3['PAGE_SIZE']['DOUBLEINTERNAL'] && _0xb07ax5 > 1 && _0xb07ax5 < _0xb07axc['pageCount']
                        , _0xb07axa = _0xb07ax9 && _0xb07ax8 ? 2 : 1
                        , _0xb07axb = _0xb07ax8 ? _0xb07ax4['getViewport'](1) : _0xb07axc['normalViewport']
                        , _0xb07axd = _0xb07axc['cacheIndex'] / Math['max'](_0xb07axb['width'] / _0xb07axa, _0xb07axb['height']);
                      1 == _0xb07axc['webgl'] && (_0xb07axd = _0xb07ax1d(_0xb07axc['cacheIndex']) / (_0xb07axc['pageRatio'] > 1 ? _0xb07axb['width'] / _0xb07axa : _0xb07axb['height']));
                      var _0xb07axe = document['createElement']('canvas')
                        , _0xb07axf = performance['now']()
                        , _0xb07ax10 = _0xb07axc['cacheIndex']
                        , _0xb07ax11 = _0xb07axe['getContext']('2d');
                      1 == _0xb07ax7 && (_0xb07axd = _0xb07axc['thumbsize'] / _0xb07axc['normalViewport']['height']);
                      _0xb07axe['height'] = Math['round'](_0xb07axb['height'] * _0xb07axd),
                      _0xb07axe['width'] = Math['round'](_0xb07axb['width'] / _0xb07axa * _0xb07axd),
                      'css' == _0xb07axc['targetObject']['mode'] && Math['abs'](_0xb07axc['targetObject']['zoomHeight'] - _0xb07axe['height']) < 2 && (_0xb07axe['height'] = _0xb07axc['targetObject']['zoomHeight'] + 0,
                      _0xb07axe['width'] = _0xb07axc['targetObject']['zoomWidth'] + 0);
                      _0xb07axb = _0xb07ax4['getViewport'](_0xb07axd),
                      _0xb07ax1c('rendering ' + _0xb07ax5 + ' at ' + _0xb07axe['width'] + 'x' + _0xb07axe['height']),
                      _0xb07ax9 && (_0xb07ax24(_0xb07axc['targetObject']) ? _0xb07ax5 % 2 == 0 && (_0xb07axb['transform'][4] = -_0xb07axe['width']) : _0xb07ax5 % 2 == 1 && (_0xb07axb['transform'][4] = -_0xb07axe['width']));
                      var _0xb07ax12 = {
                          canvasContext: _0xb07ax11,
                          viewport: _0xb07axb
                      };
                      _0xb07ax4['cleanupAfterRender'] = !0,
                      _0xb07ax4['render'](_0xb07ax12)['promise']['then'](function() {
                          _0xb07ax1c(performance['now']() - _0xb07axf),
                          _0xb07axf = performance['now'](),
                          1 == _0xb07ax7 || 1 == _0xb07axc['options']['canvasToBlob'] && !0 !== _0xb07axc['webgl'] ? _0xb07axe['toBlob'](function(_0xb07ax4) {
                              var _0xb07ax8 = _0xb07ax3['createObjectURL'](_0xb07ax4, 'image/jpeg');
                              _0xb07ax1c(performance['now']() - _0xb07axf),
                              _0xb07axc['setCache'](_0xb07ax5, _0xb07ax8, _0xb07ax7, _0xb07ax10),
                              _0xb07axc['setPage'](_0xb07ax5, _0xb07ax8, _0xb07ax6, _0xb07ax7)
                          }, 'image/jpeg', _0xb07axc['pdfRenderQuality']) : (_0xb07ax1c('Setting Page ' + _0xb07ax5),
                          _0xb07axc['setPage'](_0xb07ax5, _0xb07axe, _0xb07ax6, _0xb07ax7)),
                          _0xb07ax12 = null
                      })
                  }(_0xb07ax7, _0xb07ax4, _0xb07ax5, _0xb07ax6)
              })) : _0xb07axc['contentSourceType'] != _0xb07axe['IMAGE'] && _0xb07axc['contentSourceType'] != _0xb07axe['HTML'] || (null != _0xb07axc['getCache'](_0xb07ax4, _0xb07ax6) ? (_0xb07axc['setPage'](_0xb07ax4, _0xb07axc['getCache'](_0xb07ax4, _0xb07ax6), _0xb07ax5, _0xb07ax6),
              _0xb07ax1c('Page ' + _0xb07ax4 + ' loaded from cache')) : (!0 !== _0xb07ax6 && _0xb07axc['setLoading'](_0xb07ax4, !0),
              _0xb07axc['options']['pageSize'] == _0xb07ax3['PAGE_SIZE']['DOUBLEINTERNAL'] && _0xb07ax4 > 2 && (_0xb07axd = Math['ceil']((_0xb07ax4 - 1) / 2) + 1),
              _0xb07ax7 = _0xb07axf[_0xb07axd - 1],
              _0xb07ax8 = function(_0xb07ax3) {
                  _0xb07axc['setCache'](_0xb07ax4, _0xb07ax3, _0xb07ax6, _0xb07axc['cacheIndex']),
                  _0xb07axc['setPage'](_0xb07ax4, _0xb07ax3, _0xb07ax5, _0xb07ax6),
                  null != _0xb07ax5 && _0xb07ax5()
              }
              ,
              _0xb07axa = _0xb07axc['isCrossOrigin'],
              (_0xb07axb = new Image)['crossOrigin'] = 'Anonymous',
              _0xb07axb['onload'] = function() {
                  if (1 == _0xb07axa) {
                      var _0xb07ax4 = document['createElement']('canvas')
                        , _0xb07ax5 = _0xb07ax4['getContext']('2d');
                      _0xb07ax4['width'] = _0xb07axb['width'],
                      _0xb07ax4['height'] = _0xb07axb['height'],
                      _0xb07ax5['drawImage'](_0xb07axb, 0, 0),
                      1 == _0xb07ax9['canvasToBlob'] ? _0xb07ax4['toBlob'](function(_0xb07ax4) {
                          var _0xb07ax5 = _0xb07ax3['createObjectURL'](_0xb07ax4, 'image/jpeg');
                          null != _0xb07ax8 && _0xb07ax8(_0xb07ax5)
                      }, 'image/jpeg', 0.85) : null != _0xb07ax8 && _0xb07ax8(_0xb07ax4)
                  } else {
                      null != _0xb07ax8 && _0xb07ax8(_0xb07ax7)
                  }
                  ;_0xb07axb['onload'] = null,
                  _0xb07axb = null
              }
              ,
              _0xb07axb['src'] = _0xb07ax7,
              (_0xb07axb['complete'] || void (0) === _0xb07axb['complete']) && (_0xb07axb['src'] = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
              _0xb07axb['src'] = _0xb07ax7)))
          }
          ,
          _0xb07ax6['prototype']['getTargetPage'] = function(_0xb07ax3) {}
          ,
          _0xb07ax6['prototype']['setLoading'] = function(_0xb07ax3, _0xb07ax5) {
              if (null != this['targetObject']) {
                  if (1 == this['webgl']) {
                      var _0xb07ax6 = this['targetObject']['container'];
                      1 == _0xb07ax5 ? !0 !== _0xb07ax6['isLoading'] && (_0xb07ax6['addClass']('pdff-loading'),
                      _0xb07ax6['isLoading'] = !0,
                      _0xb07ax1c('Loading icon at ' + _0xb07ax3 + ' as ' + _0xb07ax5)) : null != _0xb07ax6['isLoading'] && (_0xb07ax6['removeClass']('pdff-loading'),
                      _0xb07ax6['isLoading'] = null,
                      _0xb07ax1c('Loading icon at ' + _0xb07ax3 + ' as ' + _0xb07ax5))
                  } else {
                      var _0xb07ax7 = _0xb07ax4(this['targetObject']['getContentLayer'](_0xb07ax3));
                      null != _0xb07ax7 && (1 == _0xb07ax5 ? _0xb07ax7['addClass']('pdff-page-loading') : _0xb07ax7['removeClass']('pdff-page-loading'),
                      _0xb07ax1c('Loading icon at ' + _0xb07ax3 + ' as ' + _0xb07ax5))
                  }
              }
          }
          ,
          _0xb07ax6['prototype']['getAnnotations'] = function(_0xb07ax5) {
              var _0xb07ax6 = this;
              if (0 != _0xb07ax6['options']['enableAnnotation']) {
                  var _0xb07ax7 = _0xb07ax6['targetObject'];
                  _0xb07ax5 = parseInt(_0xb07ax5, 10);
                  var _0xb07ax8 = _0xb07ax6['contentSource']
                    , _0xb07ax9 = _0xb07ax4(_0xb07ax7['getContentLayer'](_0xb07ax5));
                  if (_0xb07ax9['empty'](),
                  _0xb07ax5 > 0 && _0xb07ax5 <= _0xb07ax6['pageCount']) {
                      if (_0xb07ax6['contentSourceType'] == _0xb07axe['PDF']) {
                          _0xb07ax1f(_0xb07ax5);
                          var _0xb07axa = _0xb07ax5;
                          _0xb07ax6['options']['pageSize'] == _0xb07ax3['PAGE_SIZE']['DOUBLEINTERNAL'] && _0xb07ax5 > 2 && (_0xb07axa = Math['ceil']((_0xb07ax5 - 1) / 2) + 1),
                          _0xb07ax8['getPage'](_0xb07axa)['then'](function(_0xb07ax3) {
                              null != _0xb07ax9 && _0xb07ax9['length'] > 0 && _0xb07ax6['setupAnnotations'](_0xb07ax3, _0xb07ax6['viewport'], _0xb07ax9, _0xb07ax5)
                          })
                      }
                      ;if (null != _0xb07ax6['links'] && null != _0xb07ax6['links'][_0xb07ax5]) {
                          for (var _0xb07axb = _0xb07ax6['links'][_0xb07ax5], _0xb07axc = 0; _0xb07axc < _0xb07axb['length']; _0xb07axc++) {
                              var _0xb07axd, _0xb07axf = _0xb07axb[_0xb07axc];
                              _0xb07axf['dest'] && _0xb07axf['dest']['indexOf'] && 0 == _0xb07axf['dest']['indexOf']('[html]') ? ((_0xb07axd = document['createElement']('div'))['innerHTML'] = _0xb07axf['dest']['substr'](6),
                              _0xb07axd['className'] = 'customHtmlAnnotation') : ((_0xb07axd = document['createElement']('a'))['setAttribute']('dest', _0xb07axf['dest']),
                              _0xb07axd['className'] = 'customLinkAnnotation',
                              _0xb07axd['href'] = '#' + _0xb07axf['dest'],
                              _0xb07axd['onclick'] = function() {
                                  var _0xb07ax3 = this['getAttribute']('dest');
                                  return _0xb07ax3 && _0xb07ax6['linkService']['customNavigateTo'](_0xb07ax3),
                                  !1
                              }
                              ),
                              _0xb07axd['style']['left'] = _0xb07axf['x'] + '%',
                              _0xb07axd['style']['top'] = _0xb07axf['y'] + '%',
                              _0xb07axd['style']['width'] = _0xb07axf['w'] + '%',
                              _0xb07axd['style']['height'] = _0xb07axf['h'] + '%',
                              _0xb07ax9[0]['appendChild'](_0xb07axd)
                          }
                      }
                      ;if (null != _0xb07ax6['html'] && null != _0xb07ax6['html'][_0xb07ax5]) {
                          var _0xb07ax10 = _0xb07ax6['html'][_0xb07ax5];
                          _0xb07ax9['append'](_0xb07ax4('<div class=\'customHTMLAnnotation\'>')['html'](_0xb07ax10))
                      }
                  }
              }
          }
          ,
          _0xb07ax6['prototype']['setPage'] = function(_0xb07ax3, _0xb07ax4, _0xb07ax5, _0xb07ax6) {
              var _0xb07ax7 = this
                , _0xb07ax8 = _0xb07ax7['targetObject']
                , _0xb07axa = _0xb07ax24(_0xb07ax8)
                , _0xb07axb = _0xb07ax23(_0xb07ax8);
              if (1 == _0xb07ax6) {
                  _0xb07ax7['targetObject']['container']['find']('#pdff-thumb' + _0xb07ax3)['css']({
                      backgroundImage: _0xb07ax17(_0xb07ax4)
                  })
              } else {
                  _0xb07ax4 == _0xb07ax9['textureLoadFallback'] && _0xb07ax1c('Fallback on ' + _0xb07ax3);
                  var _0xb07axc = _0xb07ax8['getPageByNumber'](_0xb07ax3);
                  null != _0xb07axc ? _0xb07ax3 % 2 != 0 && !_0xb07axa || _0xb07ax3 % 2 != 1 && _0xb07axa && !_0xb07axb || _0xb07axb && !_0xb07axa ? (_0xb07ax1c(_0xb07ax3 + 'rendered to back of ' + _0xb07axc['color']),
                  _0xb07axc['backImage'](_0xb07ax4, function(_0xb07ax4, _0xb07ax6) {
                      _0xb07axc['backTextureLoaded'] = !0,
                      _0xb07ax7['setLoading'](_0xb07ax3),
                      _0xb07ax7['requiresImageTextureScaling'] && _0xb07ax6 && 1 != _0xb07ax3 && _0xb07ax3 != _0xb07ax7['pageCount'] && (_0xb07ax6['repeat']['x'] = 0.5,
                      _0xb07ax6['offset']['x'] = 0.5),
                      null != _0xb07ax5 && _0xb07ax5()
                  })) : (_0xb07ax1c(_0xb07ax3 + 'rendered to front of ' + _0xb07axc['color']),
                  _0xb07axc['frontImage'](_0xb07ax4, function(_0xb07ax4, _0xb07ax6) {
                      _0xb07axc['frontTextureLoaded'] = !0,
                      _0xb07ax7['setLoading'](_0xb07ax3),
                      _0xb07ax7['requiresImageTextureScaling'] && _0xb07ax6 && 1 != _0xb07ax3 && _0xb07ax3 != _0xb07ax7['pageCount'] && (_0xb07ax6['repeat']['x'] = 0.5),
                      null != _0xb07ax5 && _0xb07ax5()
                  })) : _0xb07ax1c('Invalid set request on Page ' + _0xb07ax3)
              }
          }
          ,
          _0xb07ax6['prototype']['setupAnnotations'] = function(_0xb07ax5, _0xb07ax6, _0xb07ax7, _0xb07ax8) {
              if (null != _0xb07ax7 && 0 != _0xb07ax4(_0xb07ax7)['length']) {
                  var _0xb07ax9 = this;
                  return _0xb07ax5['getAnnotations']()['then'](function(_0xb07axa) {
                      if (_0xb07ax6 = _0xb07ax6['clone']({
                          dontFlip: !0
                      }),
                      _0xb07ax9['options']['pageSize'],
                      _0xb07ax3['PAGE_SIZE']['DOUBLEINTERNAL'],
                      null != _0xb07ax7) {
                          0 == (_0xb07ax7 = _0xb07ax4(_0xb07ax7))['find']('.annotationDiv')['length'] && _0xb07ax7['append'](_0xb07ax4('<div class=\'annotationDiv\'>'));
                          var _0xb07axb = _0xb07ax7['find']('.annotationDiv');
                          _0xb07axb['empty'](),
                          _0xb07ax9['options']['pageSize'] == _0xb07ax3['PAGE_SIZE']['DOUBLEINTERNAL'] && _0xb07ax8 > 2 && _0xb07ax8 % 2 == 1 ? _0xb07axb['css']({
                              left: '-100%'
                          }) : 1 == _0xb07ax8 && _0xb07axb['css']({
                              left: ''
                          }),
                          PDFJS['AnnotationLayer']['render']({
                              annotations: _0xb07axa,
                              div: _0xb07axb[0],
                              page: _0xb07ax5,
                              viewport: _0xb07ax6,
                              linkService: _0xb07ax9['linkService']
                          }),
                          _0xb07ax9['options']['annotationClass'] && '' !== _0xb07ax9['options']['annotationClass'] && _0xb07axb['find'](' > section')['addClass'](_0xb07ax9['options']['annotationClass'])
                      }
                  })
              }
          }
          ,
          _0xb07ax6
      }()
        , _0xb07ax2f = function() {
          function _0xb07ax5(_0xb07ax3) {
              this['angles'] = _0xb07ax3['angles'] || [0, 0, 0, 0, 0, 0],
              this['stiffness'] = _0xb07ax3['angles'] || 0.1,
              this['segments'] = _0xb07ax3['segments'] || 1,
              this['canvasMode'] = _0xb07ax3['contentSourceType'] !== _0xb07axe['IMAGE'] && 0 == _0xb07ax3['canvasToBlob'],
              this['initDOM']()
          }

          function _0xb07ax6(_0xb07ax3) {
              var _0xb07ax5 = _0xb07ax3['contentLayer'] = _0xb07ax4(_0xb07ax11['div'], {
                  class: 'pdff-page-content'
              });
              _0xb07ax3['append'](_0xb07ax5)
          }
          return _0xb07ax5['prototype'] = {
              initDOM: function() {
                  var _0xb07ax3 = this['element'] = _0xb07ax4(_0xb07ax11['div'], {
                      class: 'ppdff-flipbook-page'
                  })
                    , _0xb07ax5 = this['wrapper'] = _0xb07ax4(_0xb07ax11['div'], {
                      class: 'pdff-page-wrapper'
                  })
                    , _0xb07ax7 = this['front'] = _0xb07ax4(_0xb07ax11['div'], {
                      class: 'pdff-page-front'
                  })
                    , _0xb07ax8 = this['back'] = _0xb07ax4(_0xb07ax11['div'], {
                      class: 'pdff-page-back'
                  })
                    , _0xb07ax9 = this['foldInnerShadow'] = _0xb07ax4(_0xb07ax11['div'], {
                      class: 'pdff-page-fold-inner-shadow'
                  })
                    , _0xb07axa = this['foldOuterShadow'] = _0xb07ax4(_0xb07ax11['div'], {
                      class: 'pdff-page-fold-outer-shadow'
                  });
                  this['frontIMG'] = new Image,
                  this['backIMG'] = new Image,
                  _0xb07ax6(_0xb07ax7, this['segments']),
                  _0xb07ax6(_0xb07ax8, this['segments']),
                  _0xb07ax3['append'](_0xb07ax5)['append'](_0xb07axa),
                  _0xb07ax5['append'](_0xb07ax7)['append'](_0xb07ax8)['append'](_0xb07ax9)
              },
              updatePoint: function(_0xb07ax4) {
                  if (null != _0xb07ax4) {
                      var _0xb07ax5 = null != this['parent']['dragPage'] ? this['parent']['dragPage'] : null != _0xb07ax4['page'] ? _0xb07ax4['page'] : this
                        , _0xb07ax6 = _0xb07ax5['element']['width']()
                        , _0xb07ax7 = _0xb07ax5['element']['height']()
                        , _0xb07ax8 = null != this['parent']['corner'] ? this['parent']['corner'] : _0xb07ax4['corner']
                        , _0xb07ax9 = _0xb07ax3['CORNERS']
                        , _0xb07axa = _0xb07ax5['side'] == _0xb07axf['right']
                        , _0xb07axb = _0xb07ax8 == _0xb07ax9['BL'] || _0xb07ax8 == _0xb07ax9['BR'];
                      _0xb07ax4['rx'] = 1 == _0xb07axa ? 2 * _0xb07ax6 - _0xb07ax4['x'] : _0xb07ax4['x'],
                      _0xb07ax4['ry'] = 1 == _0xb07axb ? _0xb07ax7 - _0xb07ax4['y'] : _0xb07ax4['y'];
                      var _0xb07axc = Math['atan2'](_0xb07ax4['ry'], _0xb07ax4['rx']);
                      _0xb07axc = Math['PI'] / 2 - _0xb07ax18(_0xb07axc, 0, _0xb07ax13(90));
                      var _0xb07axd = _0xb07axa ? _0xb07ax4['x'] / 2 : _0xb07ax6 - _0xb07ax4['x'] / 2
                        , _0xb07axe = _0xb07ax4['ry'] / 2
                        , _0xb07ax10 = Math['max'](0, Math['sin'](_0xb07axc - Math['atan2'](_0xb07axe, _0xb07axd)) * _0xb07ax19(_0xb07axd, _0xb07axe))
                        , _0xb07ax11 = 0.5 * _0xb07ax19(_0xb07ax4['rx'], _0xb07ax4['ry'])
                        , _0xb07ax12 = Math['round'](_0xb07ax6 - _0xb07ax10 * Math['sin'](_0xb07axc))
                        , _0xb07ax17 = Math['round'](_0xb07ax10 * Math['cos'](_0xb07axc))
                        , _0xb07ax1a = _0xb07ax14(_0xb07axc)
                        , _0xb07ax1b = _0xb07axb ? _0xb07axa ? 90 - _0xb07ax1a + 180 : 180 + _0xb07ax1a : _0xb07axa ? _0xb07ax1a : 90 - _0xb07ax1a
                        , _0xb07ax1c = _0xb07axb ? _0xb07axa ? 90 - _0xb07ax1a + 180 : _0xb07ax1a : _0xb07axa ? _0xb07ax1a + 180 : _0xb07ax1b
                        , _0xb07ax1d = _0xb07axb ? _0xb07axa ? 90 - _0xb07ax1a : _0xb07ax1a + 90 : _0xb07axa ? _0xb07ax1b - 90 : _0xb07ax1b + 180
                        , _0xb07ax1e = _0xb07axa ? _0xb07ax6 - _0xb07ax12 : _0xb07ax12
                        , _0xb07ax1f = _0xb07axb ? _0xb07ax7 + _0xb07ax17 : -_0xb07ax17
                        , _0xb07ax20 = _0xb07axa ? -_0xb07ax12 : _0xb07ax12 - _0xb07ax6
                        , _0xb07ax21 = _0xb07axb ? -_0xb07ax7 - _0xb07ax17 : _0xb07ax17
                        , _0xb07ax23 = _0xb07ax18(0.5 * _0xb07ax4['distance'] / _0xb07ax6, 0, 0.5)
                        , _0xb07ax24 = _0xb07ax18(0.5 * (2 * _0xb07ax6 - _0xb07ax4['rx']) / _0xb07ax6, 0.05, 0.3);
                      _0xb07ax5['element']['addClass']('pdff-folding');
                      var _0xb07ax25 = _0xb07axa ? _0xb07ax5['back'] : _0xb07ax5['front']
                        , _0xb07ax26 = _0xb07axa ? _0xb07ax5['front'] : _0xb07ax5['back']
                        , _0xb07ax27 = _0xb07ax5['foldOuterShadow']
                        , _0xb07ax28 = _0xb07ax5['foldInnerShadow'];
                      _0xb07ax5['wrapper']['css']({
                          transform: _0xb07ax15(_0xb07ax1e, _0xb07ax1f) + _0xb07ax16(_0xb07ax1b)
                      }),
                      _0xb07ax25['css']({
                          transform: _0xb07ax16(-_0xb07ax1b) + _0xb07ax15(-_0xb07ax1e, -_0xb07ax1f)
                      }),
                      _0xb07ax26['css']({
                          transform: _0xb07ax16(_0xb07ax1c) + _0xb07ax15(_0xb07ax20, _0xb07ax21),
                          boxShadow: 'rgba(0, 0, 0, ' + _0xb07ax23 + ') 0px 0px 20px'
                      }),
                      _0xb07ax28['css']({
                          transform: _0xb07ax16(_0xb07ax1c) + _0xb07ax15(_0xb07ax20, _0xb07ax21),
                          opacity: _0xb07ax24 / 2,
                          backgroundImage: _0xb07ax22['css'] + 'linear-gradient( ' + _0xb07ax1d + 'deg, rgba(0, 0, 0, 0.25) , rgb(0, 0, 0) ' + 0.7 * _0xb07ax11 + 'px, rgb(255, 255, 255) ' + _0xb07ax11 + 'px)'
                      }),
                      _0xb07ax27['css']({
                          opacity: _0xb07ax24 / 2,
                          left: _0xb07axa ? 'auto' : 0,
                          right: _0xb07axa ? 0 : 'auto',
                          backgroundImage: _0xb07ax22['css'] + 'linear-gradient( ' + (180 - _0xb07ax1d) + 'deg, rgba(0, 0, 0,0) ' + _0xb07ax11 / 3 + 'px, rgb(0, 0, 0) ' + _0xb07ax11 + 'px)'
                      })
                  }
              },
              updateAngle: function(_0xb07ax3, _0xb07ax4) {
                  var _0xb07ax5 = 5 * this['element']['width']();
                  this['wrapper']['css']({
                      perspective: _0xb07ax5,
                      perspectiveOrigin: 1 == _0xb07ax4 ? '0% 50%' : '100% 50%'
                  }),
                  this['front']['css']({
                      display: 1 == _0xb07ax4 ? _0xb07ax3 <= -90 ? 'block' : 'none' : _0xb07ax3 < 90 ? 'block' : 'none',
                      transform: ('MfS' !== _0xb07ax22['dom'] ? '' : 'perspective(' + _0xb07ax5 + 'px) ') + (1 == _0xb07ax4 ? 'translateX(-100%) ' : '') + 'rotateY(' + ((1 == _0xb07ax4 ? 180 : 0) + _0xb07ax3) + 'deg)'
                  }),
                  this['back']['css']({
                      display: 1 == _0xb07ax4 ? _0xb07ax3 > -90 ? 'block' : 'none' : _0xb07ax3 >= 90 ? 'block' : 'none',
                      transform: ('MSd' !== _0xb07ax22['dom'] ? '' : 'perspective(' + _0xb07ax5 + 'px) ') + (0 == _0xb07ax4 ? 'translateX(100%) ' : '') + 'rotateY(' + ((0 == _0xb07ax4 ? -180 : 0) + _0xb07ax3) + 'deg)'
                  })
              },
              tween: function(_0xb07ax4) {
                  var _0xb07ax5 = this;
                  if (null != _0xb07ax5 && null != _0xb07ax5['parent']) {
                      var _0xb07ax6, _0xb07ax7 = _0xb07ax23(_0xb07ax5['parent']), _0xb07ax8 = _0xb07ax5['side'] == _0xb07axf['right'], _0xb07ax9 = _0xb07ax5['parent']['direction'] == _0xb07ax3['DIRECTION']['RTL'], _0xb07axa = _0xb07ax5['parent']['corner'] == _0xb07ax3['CORNERS']['BL'] || _0xb07ax5['parent']['corner'] == _0xb07ax3['CORNERS']['BR'], _0xb07axb = 1 == _0xb07ax5['magnetic'], _0xb07axc = _0xb07axa ? _0xb07ax5['parent']['height'] : 0, _0xb07axd = 0, _0xb07axe = _0xb07ax5['end'] = _0xb07ax5 && 1 == _0xb07ax5['animateToReset'] ? {
                          x: _0xb07ax8 ? _0xb07ax5['parent']['fullWidth'] : 0,
                          y: _0xb07axc
                      } : {
                          x: _0xb07ax8 ? 0 : _0xb07ax5['parent']['fullWidth'],
                          y: _0xb07axc
                      };
                      _0xb07ax5['ease'] = _0xb07ax5['isHard'] ? TWEEN['Easing']['Quadratic']['InOut'] : TWEEN['Easing']['Linear']['None'];
                      var _0xb07ax10 = _0xb07ax5['parent']['duration'];
                      1 == _0xb07ax5['isHard'] ? (null != _0xb07ax4 && (_0xb07axd = _0xb07ax1b(_0xb07ax4['distance'], _0xb07ax4['fullWidth'])),
                      _0xb07ax6 = _0xb07ax5['init'] = {
                          angle: _0xb07axd * (_0xb07ax8 ? -1 : 1)
                      },
                      _0xb07axe = _0xb07ax5['end'] = _0xb07ax5 && 1 == _0xb07ax5['animateToReset'] ? {
                          angle: _0xb07ax8 ? 0 : -0
                      } : {
                          angle: _0xb07ax8 ? -180 : 180
                      }) : null == _0xb07ax4 ? (_0xb07ax6 = _0xb07ax5['init'] = _0xb07ax5 && 1 == _0xb07ax5['animateToReset'] ? {
                          x: _0xb07ax8 ? 0 : _0xb07ax5['parent']['fullWidth'],
                          y: 0
                      } : {
                          x: _0xb07ax8 ? _0xb07ax5['parent']['fullWidth'] : 0,
                          y: 0
                      },
                      _0xb07ax5['first'] = {
                          x: (_0xb07ax8 ? 3 : 1) * _0xb07ax5['parent']['fullWidth'] / 4,
                          y: 0
                      },
                      _0xb07ax5['mid'] = {
                          x: (_0xb07ax8 ? 1 : 3) * _0xb07ax5['parent']['fullWidth'] / 4,
                          y: 0
                      }) : (_0xb07ax6 = _0xb07ax5['init'] = {
                          x: _0xb07ax4['x'],
                          y: _0xb07ax4['y'],
                          opacity: 1
                      },
                      _0xb07ax5['first'] = {
                          x: 3 * _0xb07ax4['x'] / 4,
                          y: 3 * _0xb07ax4['y'] / 4,
                          opacity: 1
                      },
                      _0xb07ax5['mid'] = {
                          x: _0xb07ax4['x'] / 4,
                          y: _0xb07ax4['y'] / 4,
                          opacity: 1
                      },
                      _0xb07ax10 = _0xb07ax5['parent']['duration'] * _0xb07ax1a(_0xb07ax6['x'], _0xb07ax6['y'], _0xb07axe['x'], _0xb07axe['y']) / _0xb07ax5['parent']['fullWidth'],
                      _0xb07ax10 = _0xb07ax18(_0xb07ax10, _0xb07ax5['parent']['duration'] / 3, _0xb07ax5['parent']['duration'])),
                      _0xb07ax6['index'] = 0,
                      _0xb07axe['index'] = 1,
                      _0xb07ax5['isFlipping'] = !0;
                      var _0xb07ax11 = function(_0xb07ax3) {
                          1 == _0xb07ax5['isHard'] ? (_0xb07ax5['updateAngle'](_0xb07ax3['angle'], _0xb07ax8),
                          _0xb07ax5['angle'] = _0xb07ax3['angle']) : (_0xb07ax5['updatePoint']({
                              x: _0xb07ax3['x'],
                              y: _0xb07ax3['y']
                          }),
                          _0xb07ax5['x'] = _0xb07ax3['x'],
                          _0xb07ax5['y'] = _0xb07ax3['y']),
                          _0xb07ax7 && !_0xb07axb && (_0xb07ax5['element'][0]['style']['opacity'] = _0xb07ax8 && !_0xb07ax9 || !_0xb07ax8 && _0xb07ax9 ? _0xb07ax3['index'] > 0.5 ? 2 * (1 - _0xb07ax3['index']) : 1 : _0xb07ax3['index'] < 0.5 ? 2 * _0xb07ax3['index'] : 1)
                      };
                      _0xb07ax7 && (!_0xb07ax8 && !_0xb07ax9 || _0xb07ax8 && _0xb07ax9) && (_0xb07ax5['element'][0]['style']['opacity'] = 0);
                      _0xb07ax5['completeTween'] = _0xb07ax5['completeTween'] || function(_0xb07ax4) {
                          _0xb07ax5['isFlipping'] = !1,
                          1 == _0xb07ax5['isHard'] ? (_0xb07ax5['updateAngle'](_0xb07ax5['end']['angle']),
                          _0xb07ax5['back']['css']({
                              display: 'block'
                          }),
                          _0xb07ax5['front']['css']({
                              display: 'block'
                          })) : _0xb07ax5['updatePoint']({
                              x: _0xb07ax5['end']['x'],
                              y: _0xb07ax5['end']['y']
                          }),
                          _0xb07ax5['element'][0]['style']['opacity'] = 1,
                          !0 !== _0xb07ax5['animateToReset'] ? _0xb07ax5['side'] = _0xb07ax5['side'] == _0xb07axf['right'] ? _0xb07axf['left'] : _0xb07axf['right'] : _0xb07ax5['animateToReset'] = null,
                          _0xb07ax5['currentTween'] = null,
                          _0xb07ax5['pendingPoint'] = null,
                          _0xb07ax5['magnetic'] = !1,
                          _0xb07ax5['parent']['dragPage'] = null,
                          _0xb07ax5['parent']['corner'] = _0xb07ax3['CORNERS']['NONE'],
                          1 != _0xb07ax4 && _0xb07ax5['parent']['refresh']()
                      }
                      ;
                      1 == _0xb07ax5['isHard'] ? _0xb07ax5['currentTween'] = new TWEEN.Tween(_0xb07ax6)['delay'](0)['to'](_0xb07axe, _0xb07ax5['parent']['duration'])['onUpdate'](function() {
                          _0xb07ax11(this)
                      })['easing'](_0xb07ax5['ease'])['onComplete'](_0xb07ax5['completeTween'])['start']() : null == _0xb07ax4 ? _0xb07ax5['currentTween'] = new TWEEN.Tween(_0xb07ax6)['delay'](0)['to'](_0xb07axe, _0xb07ax5['parent']['duration'])['onUpdate'](function() {
                          _0xb07ax11(this)
                      })['easing'](TWEEN['Easing']['Sinusoidal'].Out)['onComplete'](_0xb07ax5['completeTween'])['start']() : (_0xb07ax5['currentTween'] = new TWEEN.Tween(_0xb07ax6)['delay'](0)['to'](_0xb07axe, _0xb07ax10)['onUpdate'](function() {
                          _0xb07ax11(this)
                      })['easing'](TWEEN['Easing']['Sinusoidal'].Out)['onComplete'](_0xb07ax5['completeTween']),
                      _0xb07ax5['currentTween']['start']())
                  }
              },
              frontImage: function(_0xb07ax3, _0xb07ax5) {
                  var _0xb07ax6 = this;

                  function _0xb07ax7() {
                      _0xb07ax6['front']['css']({
                          backgroundImage: _0xb07ax17(_0xb07ax3)
                      }),
                      null != _0xb07ax5 && _0xb07ax5()
                  }
                  1 == _0xb07ax6['canvasMode'] ? (_0xb07ax6['front']['find']('>canvas')['remove'](),
                  _0xb07ax3 !== _0xb07ax9['textureLoadFallback'] && _0xb07ax6['front']['append'](_0xb07ax4(_0xb07ax3)),
                  null != _0xb07ax5 && _0xb07ax5()) : _0xb07ax3 == _0xb07ax9['textureLoadFallback'] ? _0xb07ax7() : (_0xb07ax6['frontIMG']['onload'] = _0xb07ax7,
                  _0xb07ax6['frontIMG']['src'] = _0xb07ax3)
              },
              backImage: function(_0xb07ax3, _0xb07ax5) {
                  var _0xb07ax6 = this;

                  function _0xb07ax7() {
                      _0xb07ax6['back']['css']({
                          backgroundImage: _0xb07ax17(_0xb07ax3)
                      }),
                      null != _0xb07ax5 && _0xb07ax5()
                  }
                  1 == _0xb07ax6['canvasMode'] ? (_0xb07ax6['back']['find']('>canvas')['remove'](),
                  _0xb07ax3 !== _0xb07ax9['textureLoadFallback'] && _0xb07ax6['back']['append'](_0xb07ax4(_0xb07ax3)),
                  null != _0xb07ax5 && _0xb07ax5()) : _0xb07ax3 == _0xb07ax9['textureLoadFallback'] ? _0xb07ax7() : (_0xb07ax6['backIMG']['onload'] = _0xb07ax7,
                  _0xb07ax6['backIMG']['src'] = _0xb07ax3)
              },
              updateCSS: function(_0xb07ax3) {
                  this['element']['css'](_0xb07ax3)
              },
              resetCSS: function() {
                  this['wrapper']['css']({
                      transform: ''
                  }),
                  this['front']['css']({
                      transform: '',
                      boxShadow: ''
                  }),
                  this['back']['css']({
                      transform: '',
                      boxShadow: ''
                  })
              },
              clearTween: function(_0xb07ax3) {
                  this['currentTween']['stop'](),
                  this['completeTween'](1 == _0xb07ax3),
                  this['resetCSS']()
              }
          },
          _0xb07ax5
      }()
        , _0xb07ax30 = function(_0xb07ax5) {
          function _0xb07ax6(_0xb07ax3) {
              for (var _0xb07ax4 = !1, _0xb07ax5 = 0; _0xb07ax5 < _0xb07ax3['pages']['length']; _0xb07ax5++) {
                  if (1 == _0xb07ax3['pages'][_0xb07ax5]['isFlipping']) {
                      _0xb07ax4 = !0;
                      break
                  }
              }
              ;return _0xb07ax4
          }

          function _0xb07ax7(_0xb07ax5, _0xb07ax7) {
              var _0xb07ax8 = this;

              function _0xb07ax9(_0xb07ax3) {
                  _0xb07ax8['dragPage'] != _0xb07ax3['page'] && 1 == _0xb07ax3['page']['visible'] && (_0xb07ax8['dragPage']['clearTween'](!0),
                  _0xb07ax8['dragPage'] = _0xb07ax3['page'],
                  _0xb07ax8['corner'] = _0xb07ax3['corner'],
                  _0xb07ax8['dragPage']['pendingPoint'] = _0xb07ax3)
              }
              _0xb07ax8['type'] = 'BookCSS',
              _0xb07ax8['images'] = _0xb07ax5['images'] || [],
              _0xb07ax8['pageCount'] = _0xb07ax5['pageCount'] || 2,
              _0xb07ax8['foldSense'] = 50,
              _0xb07ax8['stackCount'] = 4,
              _0xb07ax8['mode'] = 'css',
              _0xb07ax8['pages'] = [],
              _0xb07ax8['duration'] = _0xb07ax5['duration'],
              _0xb07ax8['container'] = _0xb07ax4(_0xb07ax7),
              _0xb07ax8['options'] = _0xb07ax5,
              _0xb07ax8['drag'] = _0xb07axf['none'],
              _0xb07ax8['pageCount'] = 1 == _0xb07ax8['pageCount'] ? _0xb07ax8['pageCount'] : 2 * Math['ceil'](_0xb07ax8['pageCount'] / 2),
              _0xb07ax8['pageMode'] = _0xb07ax5['pageMode'] || (_0xb07ax25 || _0xb07ax8['pageCount'] <= 2 ? _0xb07ax3['PAGE_MODE']['SINGLE'] : _0xb07ax3['PAGE_MODE']['DOUBLE']),
              _0xb07ax8['singlePageMode'] = _0xb07ax5['singlePageMode'] || (_0xb07ax25 ? _0xb07ax3['SINGLE_PAGE_MODE']['BOOKLET'] : _0xb07ax3['SINGLE_PAGE_MODE']['ZOOM']),
              _0xb07ax8['swipe_threshold'] = _0xb07ax25 ? 15 : 50,
              _0xb07ax8['direction'] = _0xb07ax5['direction'] || _0xb07ax3['DIRECTION']['LTR'],
              _0xb07ax8['startPage'] = 1,
              _0xb07ax8['endPage'] = _0xb07ax8['pageCount'],
              _0xb07ax8['_activePage'] = _0xb07ax5['openPage'] || _0xb07ax8['startPage'],
              _0xb07ax8['hardConfig'] = _0xb07ax5['hard'],
              _0xb07axa = 'WebKitCSSMatrix'in window || document['body'] && 'MozPerspective'in document['body']['style'],
              _0xb07ax8['animateF'] = function() {
                  TWEEN['getAll']()['length'] > 0 ? TWEEN['update']() : clearInterval(_0xb07ax8['animate'])
              }
              ,
              _0xb07ax8['init'](_0xb07ax5),
              _0xb07ax8['skipDrag'] = !1;
              var _0xb07axb = function(_0xb07ax4) {
                  var _0xb07ax5 = _0xb07ax8['eventToPoint'](_0xb07ax4);
                  if (null != _0xb07ax4['touches'] && 2 == _0xb07ax4['touches']['length'] && null != _0xb07ax8['startTouches']) {
                      _0xb07ax8['zoomDirty'] = !0;
                      var _0xb07ax7 = _0xb07axd['getVectorAvg'](_0xb07axd['getTouches'](_0xb07ax4, _0xb07ax8['container']['offset']()))
                        , _0xb07ax9 = _0xb07axd['calculateScale'](_0xb07ax8['startTouches'], _0xb07axd['getTouches'](_0xb07ax4));
                      _0xb07ax8['lastScale'],
                      _0xb07ax8['contentProvider']['zoomScale'],
                      _0xb07ax7['x'],
                      _0xb07ax7['y'];
                      _0xb07ax8['stage']['css']({
                          transform: 'translate3d(' + _0xb07ax8['left'] + 'px,' + _0xb07ax8['top'] + 'px,0) scale3d(' + _0xb07ax9 + ',' + _0xb07ax9 + ',1)'
                      }),
                      _0xb07ax8['lastScale'] = _0xb07ax9,
                      _0xb07ax8['lastZoomCenter'] = _0xb07ax7,
                      _0xb07ax4['preventDefault']()
                  }
                  ;if (!(null != _0xb07ax4['touches'] && _0xb07ax4['touches']['length'] > 1 || null == _0xb07ax8['startPoint'] || null != _0xb07ax8['startTouches'])) {
                      var _0xb07axa = _0xb07ax8['dragPage'] || _0xb07ax5['page'];
                      if (1 !== _0xb07ax8['contentProvider']['zoomScale']) {
                          null == _0xb07ax4['touches'] && 1 != _0xb07ax8['isPanning'] || (_0xb07ax8['pan'](_0xb07ax5),
                          _0xb07ax4['preventDefault']())
                      } else {
                          if (!0 !== _0xb07ax8['skipDrag']) {
                              _0xb07ax5['distance'];
                              if (!_0xb07ax6(_0xb07ax8)) {
                                  if (null != _0xb07ax8['dragPage'] || 1 == _0xb07ax5['isInside']) {
                                      null != _0xb07ax8['dragPage'] ? _0xb07ax1c('set mouse down move') : (_0xb07ax5['y'] = _0xb07ax18(_0xb07ax5['y'], 1, _0xb07ax8['height'] - 1),
                                      _0xb07ax5['x'] = _0xb07ax18(_0xb07ax5['x'], 1, _0xb07ax5['fullWidth'] - 1));
                                      var _0xb07axb = _0xb07ax8['corner'] || _0xb07ax5['corner'];
                                      if (_0xb07axa['isHard']) {
                                          var _0xb07axc = _0xb07axb == _0xb07ax3['CORNERS']['BR'] || _0xb07axb == _0xb07ax3['CORNERS']['TR']
                                            , _0xb07axe = _0xb07ax1b(_0xb07ax5['distance'], _0xb07ax5['fullWidth']);
                                          _0xb07axa['updateAngle'](_0xb07axe * (_0xb07axc ? -1 : 1), _0xb07axc)
                                      } else {
                                          _0xb07axa['updatePoint'](_0xb07ax5, _0xb07ax8)
                                      }
                                      ;_0xb07axa['magnetic'] = !0,
                                      _0xb07axa['magneticCorner'] = _0xb07ax5['corner'],
                                      _0xb07ax4['preventDefault']()
                                  }
                                  ;if (null == _0xb07ax8['dragPage'] && null != _0xb07axa && 0 == _0xb07ax5['isInside'] && 1 == _0xb07axa['magnetic'] && (_0xb07axa['pendingPoint'] = _0xb07ax5,
                                  _0xb07axa['animateToReset'] = !0,
                                  _0xb07ax8['corner'] = _0xb07axa['magneticCorner'],
                                  _0xb07ax8['animatePage'](_0xb07axa),
                                  _0xb07axa['pendingPoint'] = null,
                                  _0xb07axa['magnetic'] = !1,
                                  _0xb07axa['magneticCorner'] = null),
                                  1 == _0xb07ax8['isPanning'] && null == _0xb07ax8['dragPage'] && 1 == _0xb07ax8['contentProvider']['zoomScale']) {
                                      var _0xb07ax10 = _0xb07ax5['x'] - _0xb07ax8['lastPos'];
                                      performance['now'](),
                                      _0xb07ax8['lastTime'];
                                      Math['abs'](_0xb07ax10) > _0xb07ax8['swipe_threshold'] && (_0xb07ax10 < 0 ? _0xb07ax8['next']() : _0xb07ax8['prev'](),
                                      _0xb07ax8['drag'] = _0xb07axf['none'],
                                      _0xb07ax8['isPanning'] = !1,
                                      _0xb07ax4['preventDefault']()),
                                      _0xb07ax8['lastPos'] = _0xb07ax5['x'],
                                      _0xb07ax8['lastTime'] = performance['now']()
                                  }
                              }
                          }
                      }
                  }
              }
                , _0xb07axc = function(_0xb07ax4) {
                  if (null != _0xb07ax4['touches'] && 0 == _0xb07ax4['touches']['length']) {
                      _0xb07ax8['contentProvider']['zoomScale'];
                      1 == _0xb07ax8['zoomDirty'] && (_0xb07ax8['previewObject']['contentProvider']['zoomScale'] = _0xb07axd['limitAt'](_0xb07ax8['previewObject']['contentProvider']['zoomScale'] * _0xb07ax8['lastScale'], 1, _0xb07ax8['previewObject']['contentProvider']['maxZoom']),
                      _0xb07ax8['previewObject']['zoomValue'] = 1 * _0xb07ax8['previewObject']['contentProvider']['zoomScale'],
                      _0xb07ax8['previewObject']['resize'](),
                      _0xb07ax8['zoomDirty'] = !1),
                      _0xb07ax8['wrapper']['css']({
                          transform: ''
                      }),
                      _0xb07ax8['lastScale'] = null,
                      _0xb07ax8['startTouches'] = null
                  }
                  ;if (_0xb07ax8['isPanning'] = !1,
                  !(null != _0xb07ax4['touches'] && _0xb07ax4['touches']['length'] > 1) && !0 !== _0xb07ax8['skipDrag']) {
                      var _0xb07ax5 = _0xb07ax8['eventToPoint'](_0xb07ax4);
                      _0xb07ax8['dragPage'] && (_0xb07ax4['preventDefault'](),
                      _0xb07ax8['dragPage']['pendingPoint'] = _0xb07ax5,
                      _0xb07ax5['x'] == _0xb07ax8['startPoint']['x'] && _0xb07ax5['y'] == _0xb07ax8['startPoint']['y'] && 1 == _0xb07ax5['isInside'] ? _0xb07ax8['corner'] == _0xb07ax3['CORNERS']['BR'] || _0xb07ax8['corner'] == _0xb07ax3['CORNERS']['TR'] ? (_0xb07ax9(_0xb07ax5),
                      !0 !== _0xb07ax8['dragPage']['isFlipping'] && _0xb07ax8['next']()) : _0xb07ax8['corner'] != _0xb07ax3['CORNERS']['BL'] && _0xb07ax8['corner'] != _0xb07ax3['CORNERS']['TL'] || (_0xb07ax9(_0xb07ax5),
                      !0 !== _0xb07ax8['dragPage']['isFlipping'] && _0xb07ax8['prev']()) : !0 !== _0xb07ax8['dragPage']['isFlipping'] && (_0xb07ax5['distance'] > _0xb07ax5['fullWidth'] / 2 ? _0xb07ax5['x'] > _0xb07ax5['fullWidth'] / 2 ? _0xb07ax8['prev']() : _0xb07ax8['next']() : (_0xb07ax8['dragPage']['animateToReset'] = !0,
                      _0xb07ax8['animatePage'](_0xb07ax8['dragPage']))),
                      _0xb07ax8['dragPage'] && (_0xb07ax8['dragPage']['pendingPoint'] = null,
                      _0xb07ax8['dragPage']['magnetic'] = !1)),
                      _0xb07ax8['drag'] = _0xb07axf['none']
                  }
              }
                , _0xb07axe = function(_0xb07ax4) {
                  var _0xb07ax5 = _0xb07ax8['eventToPoint'](_0xb07ax4)
                    , _0xb07ax6 = _0xb07ax4['srcElement'] || _0xb07ax4['originalTarget'];
                  _0xb07ax8['dragPage'] && _0xb07ax8['dragPage']['magnetic'] || _0xb07ax8['wrapper'][0]['contains'](_0xb07ax4['target']) && 1 == _0xb07ax8['contentProvider']['zoomScale'] && _0xb07ax5['x'] == _0xb07ax8['startPoint']['x'] && _0xb07ax5['y'] == _0xb07ax8['startPoint']['y'] && _0xb07ax5['isInsidePage'] && _0xb07ax8['startPoint']['page'] == _0xb07ax5['page'] && !_0xb07ax5['page']['isFlipping'] && 'A' !== _0xb07ax6['nodeName'] && (0 == _0xb07ax8['startPoint']['page']['side'] ? (_0xb07ax8['corner'] = _0xb07ax3['CORNERS']['TL'],
                  _0xb07ax8['prev'](),
                  _0xb07ax8['startPoint']['page'] = null) : (_0xb07ax8['corner'] = _0xb07ax3['CORNERS']['TR'],
                  _0xb07ax8['next'](),
                  _0xb07ax8['startPoint']['page'] = null),
                  _0xb07ax8['isPanning'] = !1)
              }
                , _0xb07ax10 = function(_0xb07ax4) {
                  if (null != _0xb07ax4['touches'] && 2 == _0xb07ax4['touches']['length'] && null == _0xb07ax8['startTouches'] && (_0xb07ax8['startTouches'] = _0xb07axd['getTouches'](_0xb07ax4),
                  _0xb07ax8['lastScale'] = 1),
                  !(null != _0xb07ax4['touches'] && _0xb07ax4['touches']['length'] > 1 || null == _0xb07ax4['touches'] && 0 !== _0xb07ax4['button'])) {
                      var _0xb07ax5, _0xb07ax7 = _0xb07ax8['eventToPoint'](_0xb07ax4);
                      _0xb07ax8['startPoint'] = _0xb07ax7,
                      _0xb07ax8['left'] = _0xb07ax8['left'] || 0,
                      _0xb07ax8['top'] = _0xb07ax8['top'] || 0,
                      _0xb07ax8['isPanning'] = !0,
                      _0xb07ax8['lastPos'] = _0xb07ax7['x'],
                      _0xb07ax8['lastTime'] = performance['now'](),
                      !0 !== _0xb07ax8['skipDrag'] && (1 != _0xb07ax7['isInside'] || _0xb07ax6(_0xb07ax8) || (_0xb07ax8['startPoint'] = _0xb07ax7,
                      _0xb07ax8['drag'] = _0xb07ax7['drag'],
                      _0xb07ax8['dragPage'] = _0xb07ax7['page'],
                      _0xb07ax8['corner'] = _0xb07ax7['corner'],
                      _0xb07ax1c(_0xb07ax8['corner']),
                      (_0xb07ax5 = _0xb07ax8['dragPage'])['parent']['container']['find']('.pdff-folding')['removeClass']('pdff-folding'),
                      _0xb07ax5['element']['addClass']('pdff-folding'),
                      _0xb07ax7['page']['isHard'] || _0xb07ax7['page']['updatePoint'](_0xb07ax7, _0xb07ax8),
                      '0' == _0xb07ax7['page']['name'] ? _0xb07ax8['shadow']['css']({
                          width: '50%',
                          left: _0xb07ax8['direction'] == _0xb07ax3['DIRECTION']['RTL'] ? 0 : '50%',
                          transitionDelay: ''
                      }) : _0xb07ax7['page']['name'] == Math['ceil'](_0xb07ax8['pageCount'] / 2) - 1 && _0xb07ax8['shadow']['css']({
                          width: '50%',
                          left: _0xb07ax8['direction'] == _0xb07ax3['DIRECTION']['RTL'] ? '50%' : 0,
                          transitionDelay: ''
                      })))
                  }
              }
                , _0xb07ax11 = function(_0xb07ax3) {
                  var _0xb07ax4 = 0;
                  null != _0xb07ax3['wheelDelta'] ? _0xb07ax4 = _0xb07ax3['wheelDelta'] / 120 : null != _0xb07ax3['detail'] && (_0xb07ax4 = -_0xb07ax3['detail'] / 3);
                  var _0xb07ax5 = _0xb07ax8['contentProvider']['zoomScale']
                    , _0xb07ax6 = _0xb07ax8['contentProvider']['maxZoom'];
                  if (_0xb07ax4 && (_0xb07ax4 > 0 && _0xb07ax5 < _0xb07ax6 || _0xb07ax4 < 0 && _0xb07ax5 > 1)) {
                      _0xb07ax3['stopPropagation'](),
                      _0xb07ax3['preventDefault']();
                      var _0xb07ax7 = _0xb07ax8['eventToPoint'](_0xb07ax3)
                        , _0xb07ax9 = _0xb07ax8['eventToPoint'](_0xb07ax3)
                        , _0xb07axa = _0xb07ax8['container']['width']() / 2
                        , _0xb07axb = _0xb07ax8['container']['height']() / 2 - 23;
                      _0xb07ax8['previewObject']['zoom'](_0xb07ax4);
                      var _0xb07axc = _0xb07ax8['contentProvider']['zoomScale'];
                      if (_0xb07ax5 !== _0xb07axc) {
                          var _0xb07axd = _0xb07axc / _0xb07ax5;
                          1 == _0xb07axc ? (_0xb07ax8['left'] = 0,
                          _0xb07ax8['top'] = 0) : (_0xb07ax8['left'] *= _0xb07axd,
                          _0xb07ax8['top'] *= _0xb07axd);
                          var _0xb07axe = (_0xb07ax7['raw']['x'] - _0xb07axa) * _0xb07axd
                            , _0xb07axf = (_0xb07ax7['raw']['y'] - _0xb07axb) * _0xb07axd;
                          _0xb07ax9['raw']['x'] = _0xb07axa + _0xb07axe,
                          _0xb07ax9['raw']['y'] = _0xb07axb + _0xb07axf,
                          _0xb07ax8['startPoint'] = _0xb07ax9,
                          _0xb07ax8['pan'](_0xb07ax7);
                          var _0xb07ax10 = _0xb07ax8['dragPage'] || _0xb07ax7['page'];
                          null == _0xb07ax8['dragPage'] && null != _0xb07ax10 && 1 == _0xb07ax7['isInside'] && 1 == _0xb07ax10['magnetic'] && (_0xb07ax10['pendingPoint'] = _0xb07ax7,
                          _0xb07ax10['animateToReset'] = !0,
                          _0xb07ax8['corner'] = _0xb07ax10['magneticCorner'],
                          _0xb07ax8['animatePage'](_0xb07ax10),
                          _0xb07ax10['pendingPoint'] = null,
                          _0xb07ax10['magnetic'] = !1,
                          _0xb07ax10['magneticCorner'] = null)
                      }
                  }
              }
                , _0xb07ax12 = _0xb07ax8['container'][0]
                , _0xb07ax13 = _0xb07ax8['stage'][0];
              _0xb07ax12 && (_0xb07ax13['addEventListener']('mousemove', _0xb07axb, !1),
              _0xb07ax13['addEventListener']('touchmove', _0xb07axb, !1),
              _0xb07ax13['addEventListener']('mousedown', _0xb07ax10, !1),
              _0xb07ax13['addEventListener']('click', _0xb07axe, !1),
              _0xb07ax13['addEventListener']('mouseup', _0xb07axc, !1),
              _0xb07ax13['addEventListener']('touchend', _0xb07axc, !1),
              _0xb07ax13['addEventListener']('touchstart', _0xb07ax10, !1),
              1 == _0xb07ax8['options']['scrollWheel'] && (_0xb07ax13['addEventListener']('mousewheel', _0xb07ax11, !1),
              _0xb07ax13['addEventListener']('DOMMouseScroll', _0xb07ax11, !1))),
              this['dispose'] = function() {
                  _0xb07ax13['removeEventListener']('mousemove', _0xb07axb, !1),
                  _0xb07ax13['removeEventListener']('touchmove', _0xb07axb, !1),
                  _0xb07ax13['removeEventListener']('mousedown', _0xb07ax10, !1),
                  _0xb07ax13['removeEventListener']('click', _0xb07axe, !1),
                  _0xb07ax13['removeEventListener']('mouseup', _0xb07axc, !1),
                  _0xb07ax13['removeEventListener']('touchend', _0xb07axc, !1),
                  _0xb07ax13['removeEventListener']('touchstart', _0xb07ax10, !1),
                  1 == _0xb07ax8['options']['scrollWheel'] && (_0xb07ax13['removeEventListener']('mousewheel', _0xb07ax11, !1),
                  _0xb07ax13['removeEventListener']('DOMMouseScroll', _0xb07ax11, !1)),
                  _0xb07ax8['updatePageCallback'] = null,
                  _0xb07ax8['flipCallback'] = null,
                  _0xb07ax8['animateF'] = null,
                  _0xb07ax8['stage']['remove']()
              }
          }
          return _0xb07ax29(_0xb07ax7, {}),
          _0xb07ax7['prototype'] = {
              add: function(_0xb07ax3) {
                  _0xb07ax3 instanceof _0xb07ax2f ? this['container']['append'](_0xb07ax4(_0xb07ax3['element'])) : this['container']['append'](_0xb07ax4(_0xb07ax3))
              },
              pan: function(_0xb07ax3) {
                  var _0xb07ax4 = this['startPoint']
                    , _0xb07ax5 = this['contentProvider']['zoomScale']
                    , _0xb07ax6 = this['left'] + (_0xb07ax3['raw']['x'] - _0xb07ax4['raw']['x'])
                    , _0xb07ax7 = this['top'] + (_0xb07ax3['raw']['y'] - _0xb07ax4['raw']['y']);
                  this['left'] = Math['round'](_0xb07ax18(_0xb07ax6, -this['shiftWidth'], this['shiftWidth'])),
                  this['top'] = Math['round'](_0xb07ax18(_0xb07ax7, -this['shiftHeight'], this['shiftHeight'])),
                  1 == _0xb07ax5 && (this['left'] = 0,
                  this['top'] = 0),
                  this['startPoint'] = _0xb07ax3,
                  this['stage']['css']({
                      transform: 'translate3d(' + this['left'] + 'px,' + this['top'] + 'px,0)'
                  })
              },
              getPageByNumber: function(_0xb07ax3) {
                  for (var _0xb07ax4, _0xb07ax5 = _0xb07ax23(this) ? _0xb07ax24(this) ? _0xb07ax3 + 1 : _0xb07ax3 : Math['floor']((_0xb07ax3 - 1) / 2), _0xb07ax6 = 0; _0xb07ax6 < this['pages']['length']; _0xb07ax6++) {
                      _0xb07ax5 == parseInt(this['pages'][_0xb07ax6]['name'], 10) && (_0xb07ax4 = this['pages'][_0xb07ax6])
                  }
                  ;return _0xb07ax4
              },
              getPageSide: function(_0xb07ax4) {
                  var _0xb07ax5 = this['direction'] == _0xb07ax3['DIRECTION']['RTL']
                    , _0xb07ax6 = this['getPageByNumber'](_0xb07ax4);
                  if (null != _0xb07ax6) {
                      return _0xb07ax23(this) ? _0xb07ax5 ? _0xb07ax6['front'] : _0xb07ax6['back'] : _0xb07ax4 % 2 == 0 ? _0xb07ax5 ? _0xb07ax6['back'] : _0xb07ax6['front'] : _0xb07ax5 ? _0xb07ax6['front'] : _0xb07ax6['back']
                  }
              },
              getContentLayer: function(_0xb07ax3) {
                  var _0xb07ax4 = this['getPageSide'](_0xb07ax3);
                  return null == _0xb07ax4 ? null : _0xb07ax4['contentLayer']
              }
          },
          _0xb07ax7['prototype']['init'] = function(_0xb07ax3) {
              var _0xb07ax5 = this;
              _0xb07ax5['stage'] = _0xb07ax4(_0xb07ax11['div'], {
                  class: 'ppdff-flipbook-stage'
              }),
              _0xb07ax5['wrapper'] = _0xb07ax4(_0xb07ax11['div'], {
                  class: 'ppdff-flipbook-wrapper'
              }),
              _0xb07ax5['shadow'] = _0xb07ax4(_0xb07ax11['div'], {
                  class: 'ppdff-flipbook-shadow'
              }),
              _0xb07ax5['container']['append'](_0xb07ax5['stage']),
              _0xb07ax5['stage']['append'](_0xb07ax5['wrapper']),
              _0xb07ax5['wrapper']['append'](_0xb07ax5['shadow']),
              _0xb07ax5['createStack'](_0xb07ax3)
          }
          ,
          _0xb07ax7['prototype']['createStack'] = function(_0xb07ax3) {
              for (var _0xb07ax4 = 'red,green,blue,yellow,orange,black'['split'](','), _0xb07ax5 = 0; _0xb07ax5 < this['stackCount']; _0xb07ax5++) {
                  _0xb07ax3['angles'] = [, this['stackCount'] - _0xb07ax5],
                  _0xb07ax3['stiffness'] = (this['stackCount'] - _0xb07ax5) / 100;
                  var _0xb07ax6 = new _0xb07ax2f(_0xb07ax3);
                  _0xb07ax6['angles'][1] = 180,
                  _0xb07ax6['index'] = _0xb07ax5,
                  _0xb07ax6['parent'] = this,
                  _0xb07ax6['textureReady'] = !1,
                  _0xb07ax6['textureRequested'] = !1,
                  this['wrapper']['append'](_0xb07ax6['element']),
                  _0xb07ax6['isFlipping'] = !1,
                  this['pages']['push'](_0xb07ax6),
                  _0xb07ax6['color'] = _0xb07ax4[_0xb07ax5]
              }
              ;this['children'] = this['pages']
          }
          ,
          _0xb07ax7['prototype']['isPageHard'] = function(_0xb07ax3) {
              return _0xb07axd['isHardPage'](this['hardConfig'], _0xb07ax3, this['pageCount'], _0xb07ax23(this))
          }
          ,
          _0xb07ax7['prototype']['setDuration'] = function(_0xb07ax3) {
              this['duration'] = _0xb07ax3
          }
          ,
          _0xb07ax7['prototype']['moveBy'] = function(_0xb07ax3) {
              var _0xb07ax4 = this['_activePage'] + _0xb07ax3;
              _0xb07ax4 = _0xb07ax18(_0xb07ax4, this['startPage'], this['endPage']),
              this['gotoPage'](_0xb07ax4)
          }
          ,
          _0xb07ax7['prototype']['next'] = function(_0xb07ax4) {
              null == _0xb07ax4 && (_0xb07ax4 = this['direction'] == _0xb07ax3['DIRECTION']['RTL'] ? -this['pageMode'] : this['pageMode']),
              this['moveBy'](_0xb07ax4)
          }
          ,
          _0xb07ax7['prototype']['prev'] = function(_0xb07ax4) {
              null == _0xb07ax4 && (_0xb07ax4 = this['direction'] == _0xb07ax3['DIRECTION']['RTL'] ? this['pageMode'] : -this['pageMode']),
              this['moveBy'](_0xb07ax4)
          }
          ,
          _0xb07ax7['prototype']['eventToPoint'] = function(_0xb07ax5) {
              _0xb07ax5 = _0xb07ax21(_0xb07ax5);
              var _0xb07ax6 = this['wrapper']
                , _0xb07ax7 = this['pages']
                , _0xb07ax8 = this['pageWidth']
                , _0xb07ax9 = this['fullWidth']
                , _0xb07axa = this['height']
                , _0xb07axb = (_0xb07ax4(window),
              {
                  x: _0xb07ax5['clientX'],
                  y: _0xb07ax5['clientY']
              })
                , _0xb07axc = _0xb07axb['x'] - _0xb07ax6[0]['getBoundingClientRect']()['left']
                , _0xb07axd = _0xb07axb['y'] - _0xb07ax6[0]['getBoundingClientRect']()['top'];
              _0xb07axb['x'] = _0xb07axb['x'] - this['container'][0]['getBoundingClientRect']()['left'],
              _0xb07axb['y'] = _0xb07axb['y'] - this['container'][0]['getBoundingClientRect']()['top'];
              var _0xb07axe, _0xb07ax10 = this['drag'] == _0xb07axf['none'] ? _0xb07axc < _0xb07ax8 ? _0xb07axc : _0xb07ax9 - _0xb07axc : this['drag'] == _0xb07axf['left'] ? _0xb07axc : _0xb07ax9 - _0xb07axc, _0xb07ax11 = _0xb07axc < _0xb07ax8 ? _0xb07ax7[this['stackCount'] / 2 - 1] : _0xb07ax7[this['stackCount'] / 2], _0xb07ax12 = _0xb07axc < this['foldSense'] ? _0xb07axf['left'] : _0xb07axc > _0xb07ax9 - this['foldSense'] ? _0xb07axf['right'] : _0xb07axf['none'], _0xb07ax13 = _0xb07axc, _0xb07ax14 = _0xb07axd, _0xb07ax15 = _0xb07axa, _0xb07ax16 = _0xb07ax9, _0xb07ax17 = this['foldSense'], _0xb07ax18 = _0xb07ax3['CORNERS'];
              return _0xb07axe = _0xb07ax13 >= 0 && _0xb07ax13 < _0xb07ax17 ? _0xb07ax14 >= 0 && _0xb07ax14 <= _0xb07ax17 ? _0xb07ax18['TL'] : _0xb07ax14 >= _0xb07ax15 - _0xb07ax17 && _0xb07ax14 <= _0xb07ax15 ? _0xb07ax18['BL'] : _0xb07ax14 > _0xb07ax17 && _0xb07ax14 < _0xb07ax15 - _0xb07ax17 ? _0xb07ax18['L'] : _0xb07ax18['NONE'] : _0xb07ax13 >= _0xb07ax16 - _0xb07ax17 && _0xb07ax13 <= _0xb07ax16 ? _0xb07ax14 >= 0 && _0xb07ax14 <= _0xb07ax17 ? _0xb07ax18['TR'] : _0xb07ax14 >= _0xb07ax15 - _0xb07ax17 && _0xb07ax14 <= _0xb07ax15 ? _0xb07ax18['BR'] : _0xb07ax14 > _0xb07ax17 && _0xb07ax14 < _0xb07ax15 - _0xb07ax17 ? _0xb07ax18['R'] : _0xb07ax18['NONE'] : _0xb07ax18['NONE'],
              {
                  isInsidePage: _0xb07ax13 >= 0 && _0xb07ax13 <= _0xb07ax16 && _0xb07ax14 >= 0 && _0xb07ax14 <= _0xb07ax15,
                  isInside: _0xb07axe !== _0xb07ax18['NONE'] && _0xb07axe !== _0xb07ax18['L'] && _0xb07axe !== _0xb07ax18['R'],
                  x: _0xb07axc,
                  y: _0xb07axd,
                  fullWidth: _0xb07ax9,
                  rawDistance: _0xb07ax9 - _0xb07axc,
                  distance: _0xb07ax10,
                  page: _0xb07ax11,
                  drag: _0xb07ax12,
                  foldSense: this['foldSense'],
                  event: _0xb07ax5,
                  raw: _0xb07axb,
                  corner: _0xb07axe
              }
          }
          ,
          _0xb07ax7['prototype']['gotoPage'] = function(_0xb07ax3) {
              _0xb07ax3 = parseInt(_0xb07ax3, 10),
              this['_activePage'] = _0xb07ax3,
              1 == this['autoPlay'] && this['previewObject']['setAutoPlay'](this['autoPlay']),
              this['updatePage'](_0xb07ax3),
              this && this['thumblist'] && this['thumblist']['review'] && this['thumblist']['review']()
          }
          ,
          _0xb07ax7['prototype']['refresh'] = function() {
              this['updatePage'](this._activePage),
              null != this['flipCallback'] && this['flipCallback']()
          }
          ,
          _0xb07ax7['prototype']['updatePage'] = function(_0xb07ax5) {
              var _0xb07ax6 = this['direction'] == _0xb07ax3['DIRECTION']['RTL']
                , _0xb07ax7 = _0xb07ax23(this)
                , _0xb07ax8 = (_0xb07ax1f(_0xb07ax5),
              _0xb07ax7 ? 1 : 2);
              _0xb07ax5 = Math['floor'](_0xb07ax5 / _0xb07ax8),
              _0xb07ax6 && (_0xb07ax5 = this['pageCount'] / _0xb07ax8 - _0xb07ax5);
              var _0xb07axa = this['oldBaseNumber'] || 0
                , _0xb07axb = this['pageCount'] / _0xb07ax8
                , _0xb07axc = this['stackCount']
                , _0xb07axd = Math['floor'](_0xb07axc / 2);
              _0xb07axa > _0xb07ax5 ? (this['children'][_0xb07axc - 1]['skipFlip'] = !0,
              this['children']['unshift'](this['children']['pop']())) : _0xb07axa < _0xb07ax5 && (this['children'][0]['skipFlip'] = !0,
              this['children']['push'](this['children']['shift']()));
              for (var _0xb07axe = 0; _0xb07axe < _0xb07axc; _0xb07axe++) {
                  var _0xb07ax10 = this['children'][_0xb07axe];
                  _0xb07axa !== _0xb07ax5 && null != _0xb07ax10['currentTween'] && _0xb07ax10['clearTween'](!0);
                  var _0xb07ax11, _0xb07ax12 = _0xb07ax10['side'], _0xb07ax13 = _0xb07ax5 - _0xb07axd + _0xb07axe;
                  _0xb07ax6 && (_0xb07ax13 = _0xb07ax7 ? this['pageCount'] - _0xb07ax13 : Math['floor'](this['pageCount'] / 2) - _0xb07ax13 - 1);
                  var _0xb07ax14 = _0xb07ax10['name'];
                  _0xb07ax10['isHard'] = this['isPageHard'](_0xb07ax13),
                  _0xb07ax10['isHard'] ? _0xb07ax10['element']['addClass']('pdff-hard-page') : (_0xb07ax10['element']['removeClass']('pdff-hard-page'),
                  _0xb07ax10['front']['css']({
                      display: 'block'
                  }),
                  _0xb07ax10['back']['css']({
                      display: 'block'
                  })),
                  0 == _0xb07ax13 || _0xb07ax13 == _0xb07axb ? _0xb07ax10['element']['addClass']('pdff-cover-page') : _0xb07ax10['element']['removeClass']('pdff-cover-page'),
                  _0xb07ax4(_0xb07ax10['element'])['attr']('pageNumber') != _0xb07ax13 && (_0xb07ax10['front']['contentLayer']['empty'](),
                  _0xb07ax10['back']['contentLayer']['empty']()),
                  _0xb07ax4(_0xb07ax10['element'])['attr']('pageNumber', _0xb07ax13),
                  _0xb07ax10['isEdge'] = !1,
                  0 == _0xb07axe || _0xb07axe == _0xb07axc - 1 || (_0xb07ax10['isEdge'] = !1),
                  _0xb07ax11 = _0xb07axe < _0xb07axd ? _0xb07axf['left'] : _0xb07axf['right'],
                  0 == _0xb07ax10['isFlipping'] && (_0xb07ax11 !== _0xb07ax12 && 0 == _0xb07ax10['skipFlip'] ? (this['animatePage'](_0xb07ax10),
                  null != this['preFlipCallback'] && this['preFlipCallback']()) : (_0xb07ax10['skipFlip'] = !1,
                  _0xb07ax10['element']['removeClass']('pdff-flipping pdff-quick-turn pdff-folding pdff-left-side pdff-right-side'),
                  _0xb07ax10['element']['addClass'](_0xb07axe < _0xb07axd ? 'pdff-left-side' : 'pdff-right-side'),
                  _0xb07ax10['side'] = _0xb07ax11)),
                  _0xb07ax10['visible'] = _0xb07ax7 ? _0xb07ax6 ? _0xb07axe < _0xb07axd || _0xb07ax10['isFlipping'] : _0xb07axe >= _0xb07axd || _0xb07ax10['isFlipping'] : _0xb07ax13 >= 0 && _0xb07ax13 < _0xb07axb || _0xb07ax7 && _0xb07ax13 == _0xb07axb,
                  null != this['requestPage'] && 1 == _0xb07ax10['visible'] && (_0xb07ax10['name'] = _0xb07ax13.toString(),
                  _0xb07ax10['name'] != _0xb07ax14 && (_0xb07ax10['backTextureLoaded'] = !1,
                  _0xb07ax10['frontTextureLoaded'] = !1,
                  _0xb07ax10['backPageStamp'] = '-1',
                  _0xb07ax10['frontPageStamp'] = '-1',
                  _0xb07ax10['thumbLoaded'] = !1,
                  _0xb07ax10['front']['contentLayer']['html'](''),
                  _0xb07ax10['back']['contentLayer']['html'](''),
                  _0xb07ax10['frontImage'](_0xb07ax9['textureLoadFallback']),
                  _0xb07ax10['backImage'](_0xb07ax9['textureLoadFallback']),
                  this['requestPage']())),
                  _0xb07ax10['oldDepth'] = _0xb07ax10['depth'],
                  _0xb07ax10['updateCSS']({
                      display: 1 == _0xb07ax10['visible'] ? 'block' : 'none',
                      zIndex: 6 + (_0xb07axe < _0xb07axd ? _0xb07axe - _0xb07axd : _0xb07axd - _0xb07axe),
                      transform: ''
                  }),
                  null == _0xb07ax10['pendingPoint'] && 0 == _0xb07ax10['isFlipping'] && _0xb07ax10['resetCSS']()
              }
              ;0 == TWEEN['getAll']()['length'] && clearInterval(this['animate']),
              _0xb07ax4('.quick-hint')['html'](_0xb07ax5),
              this['oldBaseNumber'] = _0xb07ax5,
              this['updatePageCallback'] && this['updatePageCallback']()
          }
          ,
          _0xb07ax7['prototype']['animatePage'] = function(_0xb07ax3) {
              _0xb07ax3['element']['addClass']('pdff-flipping'),
              _0xb07ax3['isFlipping'] = !0,
              null != this['animate'] && clearInterval(this['animate']),
              this['animate'] = setInterval(this['animateF'], 30),
              _0xb07ax3['tween'](_0xb07ax3['pendingPoint'])
          }
          ,
          _0xb07ax7
      }()
        , _0xb07ax31 = function(_0xb07ax5) {
          function _0xb07ax6(_0xb07ax6, _0xb07ax7, _0xb07ax8) {
              _0xb07ax5['call'](this, _0xb07ax8);
              var _0xb07ax9 = this;
              _0xb07ax9['type'] = 'FlipBook',
              _0xb07ax9['container'] = _0xb07ax6,
              _0xb07ax9['options'] = _0xb07ax8,
              _0xb07ax9['options']['source'] = _0xb07ax7,
              _0xb07ax9['contentSource'] = _0xb07ax7,
              null != _0xb07ax8['height'] && _0xb07ax8['height'].toString()['indexOf']('%') < 0 ? _0xb07ax9['container']['height'](Math['min'](_0xb07ax8['height'], _0xb07ax4(window)['height']())) : _0xb07ax9['container']['height'](_0xb07ax8['height']),
              _0xb07ax9['options']['isLightBox'] && window['dfLightBox']['closeButton']['addClass'](_0xb07ax9['options']['icons']['close']),
              _0xb07ax9['options']['pageSize'] == _0xb07ax3['PAGE_SIZE']['DOUBLEINTERNAL'] && ((Array === _0xb07ax9['contentSource']['constructor'] || Array['isArray'](_0xb07ax9['contentSource']) || _0xb07ax9['contentSource']instanceof Array) && (_0xb07ax9['options']['singlePageMode'] = _0xb07ax3['SINGLE_PAGE_MODE']['ZOOM']),
              _0xb07ax9['container']['addClass']('pdff-double-internal')),
              _0xb07ax9['options']['isLightBox'] || null == _0xb07ax9['container']['attr']('id') || (_0xb07ax9['options']['id'] = _0xb07ax9['container']['attr']('id')),
              !0 !== _0xb07ax9['options']['parsed'] && null != _0xb07ax9['options']['links'] && _0xb07ax3['parseLinks'](_0xb07ax9['options']['links']);
              var _0xb07axa = _0xb07ax9['webgl'] = 1 == _0xb07ax8['webgl'] && 1 == _0xb07ax26;
              if (_0xb07ax6['addClass']('pdff-container pdff-loading pdff-init pdff-floating pdff-controls-' + _0xb07ax9['options']['controlsPosition']),
              1 == _0xb07ax9['options']['transparent'] && _0xb07ax6['addClass']('pdff-transparent'),
              _0xb07ax9['options']['direction'] == _0xb07ax3['DIRECTION']['RTL'] && _0xb07ax6['addClass']('pdff-rtl'),
              _0xb07ax9['container']['info'] = _0xb07ax4(_0xb07ax11['div'], {
                  class: 'loading-info'
              })['appendTo'](_0xb07ax9['container'])['html']('Loading...'),
              (-1 !== _0xb07axc['indexOf']('MSIE') || navigator['appVersion']['indexOf']('Trident/') > 0 || _0xb07ax27 && !_0xb07ax28) && (_0xb07ax9['options']['webgl'] = !1),
              _0xb07axc['match'](/msie\s[5-9]/i)) {
                  return _0xb07ax9['container']['info']['html']('Your browser (Internet Explorer) is out of date to run pdfflip Flipbook Plugin. <br><a href=\'http://browsehappy.com/\'>Upgrade to a new one</a>')['addClass']('pdff-old-browser'),
                  _0xb07ax6['removeClass']('pdff-loading'),
                  _0xb07ax9
              }
              ;var _0xb07axb = null == _0xb07ax8['backgroundImage'] || '' == _0xb07ax8['backgroundImage'] ? '' : 'url(\'' + _0xb07ax8['backgroundImage'] + '\')';
              return _0xb07ax9['container']['css']({
                  position: 'relative',
                  overflow: 'hidden',
                  backgroundColor: _0xb07ax8['backgroundColor'],
                  backgroundImage: _0xb07axb
              }),
              _0xb07ax9['init'](_0xb07axa, _0xb07ax7),
              null != _0xb07ax9['options']['onCreate'] && _0xb07ax9['options']['onCreate'](_0xb07ax9),
              _0xb07ax9
          }
          return _0xb07ax29(_0xb07ax6, _0xb07ax5),
          _0xb07ax6['prototype']['init'] = function(_0xb07ax5) {
              var _0xb07ax6, _0xb07ax7, _0xb07ax8 = this, _0xb07axa = _0xb07ax8['target'], _0xb07axb = _0xb07ax8['options'];
              if (1 == _0xb07ax5) {
                  _0xb07ax6 = function() {
                      _0xb07ax8['container']['css']({
                          minHeight: 500,
                          minWidth: 300
                      }),
                      _0xb07ax8['stage'] = new _0xb07ax2b(_0xb07ax1e(_0xb07ax8['options'], {
                          container: _0xb07ax8['container']
                      })),
                      _0xb07ax8['stage']['previewObject'] = _0xb07ax8,
                      _0xb07ax8['contentProvider'] = new _0xb07ax2e(_0xb07ax8['contentSource'],function(_0xb07ax6) {
                          var _0xb07ax7 = {
                              pageCount: _0xb07ax6['pageCount'],
                              stackCount: 6,
                              segments: 20,
                              width: _0xb07ax6['bookSize']['width'],
                              height: _0xb07ax6['bookSize']['height']
                          };
                          _0xb07ax8['checkOpenPage'](),
                          _0xb07ax8['target'] = _0xb07axa = _0xb07ax8['stage']['target'] = new MOCKUP.Book(_0xb07ax1e(_0xb07ax8['options'], _0xb07ax7),_0xb07ax8['stage']),
                          _0xb07ax8['extendtarget'](),
                          _0xb07ax2a(_0xb07ax8['container'], _0xb07ax8),
                          _0xb07axa['ui'] = _0xb07ax8['ui'],
                          _0xb07axa['container'] = _0xb07ax8['container'],
                          _0xb07ax6['webgl'] = _0xb07ax5,
                          _0xb07ax6['setTarget'](_0xb07ax8['target']),
                          _0xb07axa['getContentLayer'] = function(_0xb07ax4) {
                              var _0xb07ax5 = _0xb07axa['direction'] == _0xb07ax3['DIRECTION']['RTL']
                                , _0xb07ax6 = _0xb07ax8['stage']['cssScene']['divLeft']['element']
                                , _0xb07ax7 = _0xb07ax8['stage']['cssScene']['divRight']['element'];
                              _0xb07ax1f(_0xb07axa._activePage);
                              return _0xb07ax23(_0xb07axa) ? _0xb07ax5 ? _0xb07ax6 : _0xb07ax7 : _0xb07ax4 % 2 == 0 ? _0xb07ax5 ? _0xb07ax7 : _0xb07ax6 : _0xb07ax5 ? _0xb07ax6 : _0xb07ax7
                          }
                          ,
                          _0xb07axa['stage'] = _0xb07ax8['stage'],
                          _0xb07axa['flipCallback'] = function() {
                              if (_0xb07ax8['contentProvider']) {
                                  _0xb07ax8['contentProvider']['review']('flipCallback');
                                  var _0xb07ax5, _0xb07ax6, _0xb07ax7 = _0xb07ax1f(_0xb07axa._activePage), _0xb07ax9 = _0xb07axa['getPageByNumber'](_0xb07ax7), _0xb07axb = _0xb07axa['getPageByNumber'](_0xb07ax7 + 1), _0xb07axc = _0xb07axa['parent']['cssScene']['divLeft'], _0xb07axd = _0xb07axa['parent']['cssScene']['divRight'];
                                  _0xb07axa['pageMode'],
                                  _0xb07ax3['PAGE_MODE']['SINGLE'],
                                  _0xb07axa['direction'],
                                  _0xb07ax3['DIRECTION']['RTL'];
                                  null != _0xb07ax9 && null != _0xb07axc && (_0xb07ax5 = Math['abs'](_0xb07ax9['geometry']['boundingBox']['max']['x'] - _0xb07ax9['geometry']['boundingBox']['min']['x']),
                                  _0xb07ax6 = Math['abs'](_0xb07ax9['geometry']['boundingBox']['max']['z'] - _0xb07ax9['geometry']['boundingBox']['min']['z']),
                                  _0xb07axc['rotation']['y'] = 0.9 * -Math['atan2'](_0xb07ax6, _0xb07ax5),
                                  _0xb07axc['position']['z'] = 0.8 * _0xb07ax6,
                                  _0xb07axc['position']['x'] = _0xb07ax6 / 2.5,
                                  _0xb07ax4(_0xb07axc['element'])['css']({
                                      width: _0xb07ax5,
                                      left: -_0xb07ax5 / 2
                                  })),
                                  null != _0xb07axb && null != _0xb07axd && (_0xb07ax5 = Math['abs'](_0xb07axb['geometry']['boundingBox']['max']['x'] - _0xb07axb['geometry']['boundingBox']['min']['x']),
                                  _0xb07ax6 = Math['abs'](_0xb07axb['geometry']['boundingBox']['max']['z'] - _0xb07axb['geometry']['boundingBox']['min']['z']),
                                  _0xb07axd['rotation']['y'] = 0.9 * Math['atan2'](_0xb07ax6, _0xb07ax5),
                                  _0xb07axd['position']['z'] = 0.8 * _0xb07ax6,
                                  _0xb07axd['position']['x'] = -_0xb07ax6 / 2.5,
                                  _0xb07ax4(_0xb07axd['element'])['css']({
                                      width: _0xb07ax5,
                                      left: _0xb07ax5 / 2
                                  })),
                                  null != _0xb07ax8['options']['onFlip'] && _0xb07ax8['options']['onFlip'](_0xb07ax8)
                              }
                          }
                          ,
                          _0xb07axa['resize'] = void (_0xb07ax8['resize']()),
                          _0xb07axa['updatePageCallback'] = function() {
                              _0xb07ax8['ui']['update'](),
                              _0xb07ax8['checkCenter'](),
                              _0xb07ax8['stage']['renderRequestPending'] = !0
                          }
                          ;
                          var _0xb07ax9 = _0xb07ax4(_0xb07ax8['stage']['cssScene']['divLeft']['element'])
                            , _0xb07axb = _0xb07ax4(_0xb07ax8['stage']['cssScene']['divRight']['element']);
                          _0xb07axa['preFlipCallback'] = function() {
                              _0xb07ax9['empty'](),
                              _0xb07axb['empty'](),
                              null != _0xb07ax8['options']['beforeFlip'] && _0xb07ax8['options']['beforeFlip'](_0xb07ax8),
                              _0xb07ax8['playSound']()
                          }
                          ,
                          _0xb07ax4(window)['trigger']('resize'),
                          _0xb07ax9['css']({
                              width: _0xb07ax6['bookSize']['width'],
                              height: _0xb07ax6['bookSize']['height'],
                              left: -_0xb07ax6['bookSize']['width'] / 2
                          }),
                          _0xb07axb['css']({
                              width: _0xb07ax6['bookSize']['width'],
                              height: _0xb07ax6['bookSize']['height'],
                              left: _0xb07ax6['bookSize']['width'] / 2
                          }),
                          _0xb07axa['ease'] = TWEEN['Easing']['Cubic']['InOut'],
                          _0xb07axa['contentProvider'] = _0xb07ax6,
                          _0xb07axa['duration'] = _0xb07ax8['options']['duration'],
                          _0xb07axa['gotoPage'](_0xb07axa._activePage),
                          _0xb07axa['flipCallback'](),
                          null != _0xb07ax8['options']['onReady'] && _0xb07ax8['options']['onReady'](_0xb07ax8)
                      }
                      ,_0xb07axb,_0xb07ax8)
                  }
                  ,
                  _0xb07ax7 = function() {
                      MOCKUP['defaults']['anisotropy'] = 0,
                      MOCKUP['defaults']['groundTexture'] = 'blank',
                      THREE['skipPowerOfTwo'] = !0,
                      _0xb07ax2c(),
                      null != _0xb07ax6 && _0xb07ax6()
                  }
                  ,
                  null == window['MOCKUP'] ? (_0xb07ax8['updateInfo']('Loading Interface ...'),
                  'function' == typeof define && define['amd'] ? (requirejs['config']({
                      paths: {
                          three: _0xb07ax9['threejsSrc']['replace']('.js', '')
                      },
                      shim: {
                          three: {
                              exports: 'THREE'
                          }
                      }
                  }),
                  require(['three'], function(_0xb07ax4) {
                      return window['THREE'] = _0xb07ax4,
                      _0xb07ax20(_0xb07ax9['utilsSrc'] + '?ver=' + _0xb07ax3['version'], function() {
                          _0xb07ax7()
                      }),
                      _0xb07ax4
                  })) : _0xb07ax20(_0xb07ax9['threejsSrc'] + '?ver=' + _0xb07ax3['version'], function() {
                      _0xb07ax20(_0xb07ax9['utilsSrc'] + '?ver=' + _0xb07ax3['version'], function() {
                          _0xb07ax7()
                      })
                  })) : _0xb07ax7()
              } else {
                  _0xb07ax8['contentProvider'] = new _0xb07ax2e(_0xb07ax8['contentSource'],function(_0xb07ax3) {
                      var _0xb07ax6 = {
                          pageCount: _0xb07ax3['pageCount'],
                          contentSourceType: _0xb07ax3['contentSourceType']
                      };
                      _0xb07ax8['checkOpenPage'](),
                      _0xb07ax8['target'] = _0xb07axa = new _0xb07ax30(_0xb07ax1e(_0xb07ax8['options'], _0xb07ax6),_0xb07ax8['container']),
                      _0xb07ax8['target']['previewObject'] = _0xb07ax8,
                      _0xb07ax8['extendtarget'](),
                      _0xb07ax2a(_0xb07ax8['container'], _0xb07ax8),
                      _0xb07ax3['webgl'] = _0xb07ax5,
                      _0xb07ax3['setTarget'](_0xb07ax8['target']),
                      _0xb07ax3['waitPeriod'] = 2,
                      _0xb07axa['ease'] = TWEEN['Easing']['Quadratic']['InOut'],
                      _0xb07axa['duration'] = _0xb07ax8['options']['duration'],
                      _0xb07axa['container'] = _0xb07ax8['container'],
                      _0xb07axa['updatePageCallback'] = function() {
                          _0xb07ax8['ui']['update'](),
                          _0xb07ax8['checkCenter']()
                      }
                      ,
                      _0xb07axa['resize'] = void (_0xb07ax8['resize']()),
                      _0xb07ax4(window)['trigger']('resize'),
                      _0xb07axa['flipCallback'] = function() {
                          _0xb07ax8['contentProvider'] && (_0xb07ax8['contentProvider']['review']('flipCallback'),
                          null != _0xb07ax8['options']['onFlip'] && _0xb07ax8['options']['onFlip'](_0xb07ax8))
                      }
                      ,
                      _0xb07axa['preFlipCallback'] = function() {
                          null != _0xb07ax8['options']['beforeFlip'] && _0xb07ax8['options']['beforeFlip'](_0xb07ax8),
                          _0xb07ax8['playSound']()
                      }
                      ,
                      _0xb07axa['gotoPage'](_0xb07axa._activePage),
                      _0xb07axa['flipCallback'](),
                      null != _0xb07ax8['options']['onReady'] && _0xb07ax8['options']['onReady'](_0xb07ax8)
                  }
                  ,_0xb07axb,_0xb07ax8)
              }
          }
          ,
          _0xb07ax6['prototype']['extendtarget'] = function() {
              var _0xb07ax3 = this;
              _0xb07ax3['target']['previewObject'] = _0xb07ax3,
              _0xb07ax3['target']['reset'] = function() {
                  for (var _0xb07ax4 = 0; _0xb07ax4 < _0xb07ax3['target']['children']['length']; _0xb07ax4++) {
                      var _0xb07ax5 = _0xb07ax3['target']['children'][_0xb07ax4];
                      _0xb07ax5['skipFlip'] = !0,
                      _0xb07ax5['name'] = '-2'
                  }
                  ;_0xb07ax3['contentProvider']['annotedPage'] = '-2',
                  _0xb07ax3['target']['refresh']()
              }
          }
          ,
          _0xb07ax6['prototype']['getURLHash'] = function() {
              if (null != this['options']['id']) {
                  var _0xb07ax3 = 'pdfflip-' + (null != this['options']['slug'] ? this['options']['slug'] : this['options']['id']) + '/';
                  null != this['target'] && null != this['target']['_activePage'] && (_0xb07ax3 += this['target']['_activePage'] + '/'),
                  window['location']['hash'] = _0xb07ax3
              }
              ;return window['location']['href']
          }
          ,
          _0xb07ax6['prototype']['checkOpenPage'] = function() {
              if (null != this['options']['id']) {
                  var _0xb07ax3 = _0xb07ax4('#' + this['options']['id']);
                  if (_0xb07ax3['length'] > 0 && null != _0xb07ax3['data']('page')) {
                      var _0xb07ax5 = parseInt(_0xb07ax3['data']('page'), 10);
                      isNaN(_0xb07ax5) || (this['options']['openPage'] = _0xb07ax5)
                  }
              }
          }
          ,
          _0xb07ax6['prototype']['end'] = function() {
              this['target']['gotoPage'](this['target']['endPage'])
          }
          ,
          _0xb07ax6['prototype']['gotoPage'] = function(_0xb07ax3) {
              this['target']['gotoPage'](_0xb07ax3),
              null != this['ui'] && this['ui']['update']()
          }
          ,
          _0xb07ax6['prototype']['prev'] = function() {
              this['target']['prev']()
          }
          ,
          _0xb07ax6['prototype']['next'] = function() {
              this['target']['next']()
          }
          ,
          _0xb07ax6['prototype']['updateInfo'] = function(_0xb07ax3) {
              this['container'] && this['container']['info'] && this['container']['info']['html'] && this['container']['info']['html'](_0xb07ax3)
          }
          ,
          _0xb07ax6
      }(_0xb07ax2d);
      _0xb07ax4['fn']['extend']({
          shelf: function() {},
          flipBook: function(_0xb07ax3, _0xb07ax5) {
              return new _0xb07ax31(_0xb07ax4(this),_0xb07ax3,(_0xb07ax6 = _0xb07ax5,
              _0xb07ax4['extend'](!0, {}, _0xb07ax9, _0xb07ax6)));
              var _0xb07ax6
          }
      })
  }(pdfflip, jQuery),
  function(_0xb07ax3) {
      if (_0xb07ax3['URL'] = _0xb07ax3['URL'] || _0xb07ax3['webkitURL'],
      _0xb07ax3['Blob'] && _0xb07ax3['URL']) {
          try {
              return void (new Blob)
          } catch (_0xb07ax3) {}
      }
      ;var _0xb07ax4 = _0xb07ax3['BlobBuilder'] || _0xb07ax3['WebKitBlobBuilder'] || _0xb07ax3['MozBlobBuilder'] || function(_0xb07ax3) {
          var _0xb07ax4 = function(_0xb07ax3) {
              return Object['prototype']['toString']['call'](_0xb07ax3)['match'](/^\[object\s(.*)\]$/)[1]
          }
            , _0xb07ax5 = function() {
              this['data'] = []
          }
            , _0xb07ax6 = function(_0xb07ax3, _0xb07ax4, _0xb07ax5) {
              this['data'] = _0xb07ax3,
              this['size'] = _0xb07ax3['length'],
              this['type'] = _0xb07ax4,
              this['encoding'] = _0xb07ax5
          }
            , _0xb07ax7 = _0xb07ax5['prototype']
            , _0xb07ax8 = _0xb07ax6['prototype']
            , _0xb07ax9 = _0xb07ax3['FileReaderSync']
            , _0xb07axa = function(_0xb07ax3) {
              this['code'] = this[this['name'] = _0xb07ax3]
          }
            , _0xb07axb = 'NOT_FOUND_ERR SECURITY_ERR ABORT_ERR NOT_READABLE_ERR ENCODING_ERR NO_MODIFICATION_ALLOWED_ERR INVALID_STATE_ERR SYNTAX_ERR'['split'](' ')
            , _0xb07axc = _0xb07axb['length']
            , _0xb07axd = _0xb07ax3['URL'] || _0xb07ax3['webkitURL'] || _0xb07ax3
            , _0xb07axe = _0xb07axd['createObjectURL']
            , _0xb07axf = _0xb07axd['revokeObjectURL']
            , _0xb07ax10 = _0xb07axd
            , _0xb07ax11 = _0xb07ax3['btoa']
            , _0xb07ax12 = _0xb07ax3['atob']
            , _0xb07ax13 = _0xb07ax3['ArrayBuffer']
            , _0xb07ax14 = _0xb07ax3['Uint8Array']
            , _0xb07ax15 = /^[\w-]+:\/*\[?[\w\.:-]+\]?(?::[0-9]+)?/;
          for (_0xb07ax6['fake'] = _0xb07ax8['fake'] = !0; _0xb07axc--; ) {
              _0xb07axa['prototype'][_0xb07axb[_0xb07axc]] = _0xb07axc + 1
          }
          ;return _0xb07axd['createObjectURL'] || (_0xb07ax10 = _0xb07ax3['URL'] = function(_0xb07ax3) {
              var _0xb07ax4, _0xb07ax5 = document['createElementNS']('http://www.w3.org/1999/xhtml', 'a');
              return _0xb07ax5['href'] = _0xb07ax3,
              'origin'in _0xb07ax5 || ('data:' === _0xb07ax5['protocol']['toLowerCase']() ? _0xb07ax5['origin'] = null : (_0xb07ax4 = _0xb07ax3['match'](_0xb07ax15),
              _0xb07ax5['origin'] = _0xb07ax4 && _0xb07ax4[1])),
              _0xb07ax5
          }
          ),
          _0xb07ax10['createObjectURL'] = function(_0xb07ax3) {
              var _0xb07ax4, _0xb07ax5 = _0xb07ax3['type'];
              return null === _0xb07ax5 && (_0xb07ax5 = 'application/octet-stream'),
              _0xb07ax3 instanceof _0xb07ax6 ? (_0xb07ax4 = 'data:' + _0xb07ax5,
              'base64' === _0xb07ax3['encoding'] ? _0xb07ax4 + ';base64,' + _0xb07ax3['data'] : 'URI' === _0xb07ax3['encoding'] ? _0xb07ax4 + ',' + decodeURIComponent(_0xb07ax3['data']) : _0xb07ax11 ? _0xb07ax4 + ';base64,' + _0xb07ax11(_0xb07ax3['data']) : _0xb07ax4 + ',' + encodeURIComponent(_0xb07ax3['data'])) : _0xb07axe ? _0xb07axe['call'](_0xb07axd, _0xb07ax3) : void (0)
          }
          ,
          _0xb07ax10['revokeObjectURL'] = function(_0xb07ax3) {
              'data:' !== _0xb07ax3['substring'](0, 5) && _0xb07axf && _0xb07axf['call'](_0xb07axd, _0xb07ax3)
          }
          ,
          _0xb07ax7['append'] = function(_0xb07ax3) {
              var _0xb07ax5 = this['data'];
              if (_0xb07ax14 && (_0xb07ax3 instanceof _0xb07ax13 || _0xb07ax3 instanceof _0xb07ax14)) {
                  for (var _0xb07ax7 = '', _0xb07ax8 = new _0xb07ax14(_0xb07ax3), _0xb07axb = 0, _0xb07axc = _0xb07ax8['length']; _0xb07axb < _0xb07axc; _0xb07axb++) {
                      _0xb07ax7 += String['fromCharCode'](_0xb07ax8[_0xb07axb])
                  }
                  ;_0xb07ax5['push'](_0xb07ax7)
              } else {
                  if ('Blob' === _0xb07ax4(_0xb07ax3) || 'File' === _0xb07ax4(_0xb07ax3)) {
                      if (!_0xb07ax9) {
                          throw new _0xb07axa('NOT_READABLE_ERR')
                      }
                      ;var _0xb07axd = new _0xb07ax9;
                      _0xb07ax5['push'](_0xb07axd['readAsBinaryString'](_0xb07ax3))
                  } else {
                      _0xb07ax3 instanceof _0xb07ax6 ? 'base64' === _0xb07ax3['encoding'] && _0xb07ax12 ? _0xb07ax5['push'](_0xb07ax12(_0xb07ax3['data'])) : 'URI' === _0xb07ax3['encoding'] ? _0xb07ax5['push'](decodeURIComponent(_0xb07ax3['data'])) : 'raw' === _0xb07ax3['encoding'] && _0xb07ax5['push'](_0xb07ax3['data']) : ('string' != typeof _0xb07ax3 && (_0xb07ax3 += ''),
                      _0xb07ax5['push'](unescape(encodeURIComponent(_0xb07ax3))))
                  }
              }
          }
          ,
          _0xb07ax7['getBlob'] = function(_0xb07ax3) {
              return arguments['length'] || (_0xb07ax3 = null),
              new _0xb07ax6(this['data']['join'](''),_0xb07ax3,'raw')
          }
          ,
          _0xb07ax7['toString'] = function() {
              return '[object BlobBuilder]'
          }
          ,
          _0xb07ax8['slice'] = function(_0xb07ax3, _0xb07ax4, _0xb07ax5) {
              var _0xb07ax7 = arguments['length'];
              return _0xb07ax7 < 3 && (_0xb07ax5 = null),
              new _0xb07ax6(this['data']['slice'](_0xb07ax3, _0xb07ax7 > 1 ? _0xb07ax4 : this['data']['length']),_0xb07ax5,this['encoding'])
          }
          ,
          _0xb07ax8['toString'] = function() {
              return '[object Blob]'
          }
          ,
          _0xb07ax8['close'] = function() {
              this['size'] = 0,
              delete this['data']
          }
          ,
          _0xb07ax5
      }(_0xb07ax3);
      _0xb07ax3['Blob'] = function(_0xb07ax3, _0xb07ax5) {
          var _0xb07ax6 = _0xb07ax5 && _0xb07ax5['type'] || ''
            , _0xb07ax7 = new _0xb07ax4;
          if (_0xb07ax3) {
              for (var _0xb07ax8 = 0, _0xb07ax9 = _0xb07ax3['length']; _0xb07ax8 < _0xb07ax9; _0xb07ax8++) {
                  Uint8Array && _0xb07ax3[_0xb07ax8]instanceof Uint8Array ? _0xb07ax7['append'](_0xb07ax3[_0xb07ax8]['buffer']) : _0xb07ax7['append'](_0xb07ax3[_0xb07ax8])
              }
          }
          ;var _0xb07axa = _0xb07ax7['getBlob'](_0xb07ax6);
          return !_0xb07axa['slice'] && _0xb07axa['webkitSlice'] && (_0xb07axa['slice'] = _0xb07axa['webkitSlice']),
          _0xb07axa
      }
      ;
      var _0xb07ax5 = Object['getPrototypeOf'] || function(_0xb07ax3) {
          return _0xb07ax3['__proto__']
      }
      ;
      _0xb07ax3['Blob']['prototype'] = _0xb07ax5(new _0xb07ax3.Blob)
  }(window),
  function(_0xb07ax3) {
      var _0xb07ax4, _0xb07ax5 = _0xb07ax3['Uint8Array'], _0xb07ax6 = _0xb07ax3['HTMLCanvasElement'], _0xb07ax7 = _0xb07ax6 && _0xb07ax6['prototype'], _0xb07ax8 = /\s*;\s*base64\s*(?:;|$)/i, _0xb07ax9 = 'toDataURL';
      _0xb07ax5 && (_0xb07ax4 = new _0xb07ax5([62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, 0, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51])),
      _0xb07ax6 && !_0xb07ax7['toBlob'] && (_0xb07ax7['toBlob'] = function(_0xb07ax3, _0xb07ax6) {
          if (_0xb07ax6 || (_0xb07ax6 = 'image/png'),
          this['mozGetAsFile']) {
              _0xb07ax3(this['mozGetAsFile']('canvas', _0xb07ax6))
          } else {
              if (this['msToBlob'] && /^\s*image\/png\s*(?:$|;)/i['test'](_0xb07ax6)) {
                  _0xb07ax3(this['msToBlob']())
              } else {
                  var _0xb07ax7, _0xb07axa = Array['prototype']['slice']['call'](arguments, 1), _0xb07axb = this[_0xb07ax9]['apply'](this, _0xb07axa), _0xb07axc = _0xb07axb['indexOf'](','), _0xb07axd = _0xb07axb['substring'](_0xb07axc + 1), _0xb07axe = _0xb07ax8['test'](_0xb07axb['substring'](0, _0xb07axc));
                  Blob['fake'] ? ((_0xb07ax7 = new Blob)['encoding'] = _0xb07axe ? 'base64' : 'URI',
                  _0xb07ax7['data'] = _0xb07axd,
                  _0xb07ax7['size'] = _0xb07axd['length']) : _0xb07ax5 && (_0xb07ax7 = _0xb07axe ? new Blob([function(_0xb07ax3) {
                      for (var _0xb07ax6, _0xb07ax7, _0xb07ax8 = _0xb07ax3['length'], _0xb07ax9 = new _0xb07ax5(_0xb07ax8 / 4 * 3 | 0), _0xb07axa = 0, _0xb07axb = 0, _0xb07axc = [0, 0], _0xb07axd = 0, _0xb07axe = 0; _0xb07ax8--; ) {
                          _0xb07ax7 = _0xb07ax3['charCodeAt'](_0xb07axa++),
                          255 !== (_0xb07ax6 = _0xb07ax4[_0xb07ax7 - 43]) && null != _0xb07ax6 && (_0xb07axc[1] = _0xb07axc[0],
                          _0xb07axc[0] = _0xb07ax7,
                          _0xb07axe = _0xb07axe << 6 | _0xb07ax6,
                          4 == ++_0xb07axd && (_0xb07ax9[_0xb07axb++] = _0xb07axe >>> 16,
                          61 !== _0xb07axc[1] && (_0xb07ax9[_0xb07axb++] = _0xb07axe >>> 8),
                          61 !== _0xb07axc[0] && (_0xb07ax9[_0xb07axb++] = _0xb07axe),
                          _0xb07axd = 0))
                      }
                      ;return _0xb07ax9
                  }(_0xb07axd)],{
                      type: _0xb07ax6
                  }) : new Blob([decodeURIComponent(_0xb07axd)],{
                      type: _0xb07ax6
                  })),
                  _0xb07ax3(_0xb07ax7)
              }
          }
      }
      ,
      _0xb07ax7['toDataURLHD'] ? _0xb07ax7['toBlobHD'] = function() {
          _0xb07ax9 = 'toDataURLHD';
          var _0xb07ax3 = this['toBlob']();
          return _0xb07ax9 = 'toDataURL',
          _0xb07ax3
      }
      : _0xb07ax7['toBlobHD'] = _0xb07ax7['toBlob'])
  }(window),
  function() {
      if ('performance'in window == !1 && (window['performance'] = {}),
      Date['now'] = Date['now'] || function() {
          return (new Date)['getTime']()
      }
      ,
      'now'in window['performance'] == !1) {
          var _0xb07ax3 = window['performance']['timing'] && window['performance']['timing']['navigationStart'] ? window['performance']['timing']['navigationStart'] : Date['now']();
          window['performance']['now'] = function() {
              return Date['now']() - _0xb07ax3
          }
      }
  }(),
  function() {
      var _0xb07ax3, _0xb07ax4, _0xb07ax5 = _0xb07ax5 || (_0xb07ax3 = [],
      {
          getAll: function() {
              return _0xb07ax3
          },
          removeAll: function() {
              _0xb07ax3 = []
          },
          add: function(_0xb07ax4) {
              _0xb07ax3['push'](_0xb07ax4)
          },
          remove: function(_0xb07ax4) {
              var _0xb07ax5 = _0xb07ax3['indexOf'](_0xb07ax4);
              -1 !== _0xb07ax5 && _0xb07ax3['splice'](_0xb07ax5, 1)
          },
          update: function(_0xb07ax4) {
              if (0 === _0xb07ax3['length']) {
                  return !1
              }
              ;var _0xb07ax5 = 0;
              for (_0xb07ax4 = null != _0xb07ax4 ? _0xb07ax4 : window['performance']['now'](); _0xb07ax5 < _0xb07ax3['length']; ) {
                  _0xb07ax3[_0xb07ax5]['update'](_0xb07ax4) ? _0xb07ax5++ : _0xb07ax3['splice'](_0xb07ax5, 1)
              }
              ;return !0
          }
      });
      _0xb07ax5['Tween'] = function(_0xb07ax3) {
          var _0xb07ax4 = _0xb07ax3
            , _0xb07ax6 = {}
            , _0xb07ax7 = {}
            , _0xb07ax8 = {}
            , _0xb07ax9 = 1e3
            , _0xb07axa = 0
            , _0xb07axb = !1
            , _0xb07axc = !1
            , _0xb07axd = !1
            , _0xb07axe = 0
            , _0xb07axf = null
            , _0xb07ax10 = _0xb07ax5['Easing']['Linear']['None']
            , _0xb07ax11 = _0xb07ax5['Interpolation']['Linear']
            , _0xb07ax12 = []
            , _0xb07ax13 = null
            , _0xb07ax14 = !1
            , _0xb07ax15 = null
            , _0xb07ax16 = null
            , _0xb07ax17 = null;
          for (var _0xb07ax18 in _0xb07ax3) {
              _0xb07ax6[_0xb07ax18] = parseFloat(_0xb07ax3[_0xb07ax18], 10)
          }
          ;this['to'] = function(_0xb07ax3, _0xb07ax4) {
              return null != _0xb07ax4 && (_0xb07ax9 = _0xb07ax4),
              _0xb07ax7 = _0xb07ax3,
              this
          }
          ,
          this['start'] = function(_0xb07ax3) {
              _0xb07ax5['add'](this),
              _0xb07axc = !0,
              _0xb07ax14 = !1,
              _0xb07axf = null != _0xb07ax3 ? _0xb07ax3 : window['performance']['now'](),
              _0xb07axf += _0xb07axe;
              for (var _0xb07ax9 in _0xb07ax7) {
                  if (_0xb07ax7[_0xb07ax9]instanceof Array) {
                      if (0 === _0xb07ax7[_0xb07ax9]['length']) {
                          continue
                      }
                      ;_0xb07ax7[_0xb07ax9] = [_0xb07ax4[_0xb07ax9]]['concat'](_0xb07ax7[_0xb07ax9])
                  }
                  ;null !== _0xb07ax6[_0xb07ax9] && (_0xb07ax6[_0xb07ax9] = _0xb07ax4[_0xb07ax9],
                  _0xb07ax6[_0xb07ax9]instanceof Array == !1 && (_0xb07ax6[_0xb07ax9] *= 1),
                  _0xb07ax8[_0xb07ax9] = _0xb07ax6[_0xb07ax9] || 0)
              }
              ;return this
          }
          ,
          this['stop'] = function() {
              return _0xb07axc ? (_0xb07ax5['remove'](this),
              _0xb07axc = !1,
              null !== _0xb07ax17 && _0xb07ax17['call'](_0xb07ax4),
              this['stopChainedTweens'](),
              this) : this
          }
          ,
          this['stopChainedTweens'] = function() {
              for (var _0xb07ax3 = 0, _0xb07ax4 = _0xb07ax12['length']; _0xb07ax3 < _0xb07ax4; _0xb07ax3++) {
                  _0xb07ax12[_0xb07ax3]['stop']()
              }
          }
          ,
          this['complete'] = function() {
              return _0xb07axc ? (_0xb07ax5['remove'](this),
              _0xb07axc = !1,
              null !== _0xb07ax16 && _0xb07ax16['call'](_0xb07ax4),
              this['completeChainedTweens'](),
              this) : this
          }
          ,
          this['completeChainedTweens'] = function() {
              for (var _0xb07ax3 = 0, _0xb07ax4 = _0xb07ax12['length']; _0xb07ax3 < _0xb07ax4; _0xb07ax3++) {
                  _0xb07ax12[_0xb07ax3]['complete']()
              }
          }
          ,
          this['delay'] = function(_0xb07ax3) {
              return _0xb07axe = _0xb07ax3,
              this
          }
          ,
          this['repeat'] = function(_0xb07ax3) {
              return _0xb07axa = _0xb07ax3,
              this
          }
          ,
          this['yoyo'] = function(_0xb07ax3) {
              return _0xb07axb = _0xb07ax3,
              this
          }
          ,
          this['easing'] = function(_0xb07ax3) {
              return _0xb07ax10 = null == _0xb07ax3 ? _0xb07ax10 : _0xb07ax3,
              this
          }
          ,
          this['interpolation'] = function(_0xb07ax3) {
              return _0xb07ax11 = _0xb07ax3,
              this
          }
          ,
          this['chain'] = function() {
              return _0xb07ax12 = arguments,
              this
          }
          ,
          this['onStart'] = function(_0xb07ax3) {
              return _0xb07ax13 = _0xb07ax3,
              this
          }
          ,
          this['onUpdate'] = function(_0xb07ax3) {
              return _0xb07ax15 = _0xb07ax3,
              this
          }
          ,
          this['onComplete'] = function(_0xb07ax3) {
              return _0xb07ax16 = _0xb07ax3,
              this
          }
          ,
          this['onStop'] = function(_0xb07ax3) {
              return _0xb07ax17 = _0xb07ax3,
              this
          }
          ,
          this['update'] = function(_0xb07ax3) {
              var _0xb07ax5, _0xb07axc, _0xb07ax17;
              if (_0xb07ax3 < _0xb07axf) {
                  return !0
              }
              ;!1 === _0xb07ax14 && (null !== _0xb07ax13 && _0xb07ax13['call'](_0xb07ax4),
              _0xb07ax14 = !0),
              _0xb07ax17 = _0xb07ax10(_0xb07axc = (_0xb07axc = (_0xb07ax3 - _0xb07axf) / _0xb07ax9) > 1 ? 1 : _0xb07axc);
              for (_0xb07ax5 in _0xb07ax7) {
                  if (null !== _0xb07ax6[_0xb07ax5]) {
                      var _0xb07ax18 = _0xb07ax6[_0xb07ax5] || 0
                        , _0xb07ax19 = _0xb07ax7[_0xb07ax5];
                      _0xb07ax19 instanceof Array ? _0xb07ax4[_0xb07ax5] = _0xb07ax11(_0xb07ax19, _0xb07ax17) : ('string' == typeof _0xb07ax19 && (_0xb07ax19 = _0xb07ax19['startsWith']('+') || _0xb07ax19['startsWith']('-') ? _0xb07ax18 + parseFloat(_0xb07ax19, 10) : parseFloat(_0xb07ax19, 10)),
                      'number' == typeof _0xb07ax19 && (_0xb07ax4[_0xb07ax5] = _0xb07ax18 + (_0xb07ax19 - _0xb07ax18) * _0xb07ax17))
                  }
              }
              ;if (null !== _0xb07ax15 && _0xb07ax15['call'](_0xb07ax4, _0xb07ax17),
              1 === _0xb07axc) {
                  if (_0xb07axa > 0) {
                      isFinite(_0xb07axa) && _0xb07axa--;
                      for (_0xb07ax5 in _0xb07ax8) {
                          if ('string' == typeof _0xb07ax7[_0xb07ax5] && (_0xb07ax8[_0xb07ax5] = _0xb07ax8[_0xb07ax5] + parseFloat(_0xb07ax7[_0xb07ax5], 10)),
                          _0xb07axb) {
                              var _0xb07ax1a = _0xb07ax8[_0xb07ax5];
                              _0xb07ax8[_0xb07ax5] = _0xb07ax7[_0xb07ax5],
                              _0xb07ax7[_0xb07ax5] = _0xb07ax1a
                          }
                          ;_0xb07ax6[_0xb07ax5] = _0xb07ax8[_0xb07ax5]
                      }
                      ;return _0xb07axb && (_0xb07axd = !_0xb07axd),
                      _0xb07axf = _0xb07ax3 + _0xb07axe,
                      !0
                  }
                  ;null !== _0xb07ax16 && _0xb07ax16['call'](_0xb07ax4);
                  for (var _0xb07ax1b = 0, _0xb07ax1c = _0xb07ax12['length']; _0xb07ax1b < _0xb07ax1c; _0xb07ax1b++) {
                      _0xb07ax12[_0xb07ax1b]['start'](_0xb07axf + _0xb07ax9)
                  }
                  ;return !1
              }
              ;return !0
          }
      }
      ,
      _0xb07ax5['Easing'] = {
          Linear: {
              None: function(_0xb07ax3) {
                  return _0xb07ax3
              }
          },
          Quadratic: {
              In: function(_0xb07ax3) {
                  return _0xb07ax3 * _0xb07ax3
              },
              Out: function(_0xb07ax3) {
                  return _0xb07ax3 * (2 - _0xb07ax3)
              },
              InOut: function(_0xb07ax3) {
                  return (_0xb07ax3 *= 2) < 1 ? 0.5 * _0xb07ax3 * _0xb07ax3 : -0.5 * (--_0xb07ax3 * (_0xb07ax3 - 2) - 1)
              }
          },
          Quartic: {
              In: function(_0xb07ax3) {
                  return _0xb07ax3 * _0xb07ax3 * _0xb07ax3 * _0xb07ax3
              },
              Out: function(_0xb07ax3) {
                  return 1 - --_0xb07ax3 * _0xb07ax3 * _0xb07ax3 * _0xb07ax3
              },
              InOut: function(_0xb07ax3) {
                  return (_0xb07ax3 *= 2) < 1 ? 0.5 * _0xb07ax3 * _0xb07ax3 * _0xb07ax3 * _0xb07ax3 : -0.5 * ((_0xb07ax3 -= 2) * _0xb07ax3 * _0xb07ax3 * _0xb07ax3 - 2)
              }
          },
          Sinusoidal: {
              In: function(_0xb07ax3) {
                  return 1 - Math['cos'](_0xb07ax3 * Math['PI'] / 2)
              },
              Out: function(_0xb07ax3) {
                  return Math['sin'](_0xb07ax3 * Math['PI'] / 2)
              },
              InOut: function(_0xb07ax3) {
                  return 0.5 * (1 - Math['cos'](Math['PI'] * _0xb07ax3))
              }
          },
          Cubic: {
              In: function(_0xb07ax3) {
                  return _0xb07ax3 * _0xb07ax3 * _0xb07ax3
              },
              Out: function(_0xb07ax3) {
                  return --_0xb07ax3 * _0xb07ax3 * _0xb07ax3 + 1
              },
              InOut: function(_0xb07ax3) {
                  return (_0xb07ax3 *= 2) < 1 ? 0.5 * _0xb07ax3 * _0xb07ax3 * _0xb07ax3 : 0.5 * ((_0xb07ax3 -= 2) * _0xb07ax3 * _0xb07ax3 + 2)
              }
          }
      },
      _0xb07ax5['Interpolation'] = {
          Linear: function(_0xb07ax3, _0xb07ax4) {
              var _0xb07ax6 = _0xb07ax3['length'] - 1
                , _0xb07ax7 = _0xb07ax6 * _0xb07ax4
                , _0xb07ax8 = Math['floor'](_0xb07ax7)
                , _0xb07ax9 = _0xb07ax5['Interpolation']['Utils']['Linear'];
              return _0xb07ax4 < 0 ? _0xb07ax9(_0xb07ax3[0], _0xb07ax3[1], _0xb07ax7) : _0xb07ax4 > 1 ? _0xb07ax9(_0xb07ax3[_0xb07ax6], _0xb07ax3[_0xb07ax6 - 1], _0xb07ax6 - _0xb07ax7) : _0xb07ax9(_0xb07ax3[_0xb07ax8], _0xb07ax3[_0xb07ax8 + 1 > _0xb07ax6 ? _0xb07ax6 : _0xb07ax8 + 1], _0xb07ax7 - _0xb07ax8)
          },
          Bezier: function(_0xb07ax3, _0xb07ax4) {
              for (var _0xb07ax6 = 0, _0xb07ax7 = _0xb07ax3['length'] - 1, _0xb07ax8 = Math['pow'], _0xb07ax9 = _0xb07ax5['Interpolation']['Utils']['Bernstein'], _0xb07axa = 0; _0xb07axa <= _0xb07ax7; _0xb07axa++) {
                  _0xb07ax6 += _0xb07ax8(1 - _0xb07ax4, _0xb07ax7 - _0xb07axa) * _0xb07ax8(_0xb07ax4, _0xb07axa) * _0xb07ax3[_0xb07axa] * _0xb07ax9(_0xb07ax7, _0xb07axa)
              }
              ;return _0xb07ax6
          },
          Utils: {
              Linear: function(_0xb07ax3, _0xb07ax4, _0xb07ax5) {
                  return (_0xb07ax4 - _0xb07ax3) * _0xb07ax5 + _0xb07ax3
              },
              Bernstein: function(_0xb07ax3, _0xb07ax4) {
                  var _0xb07ax6 = _0xb07ax5['Interpolation']['Utils']['Factorial'];
                  return _0xb07ax6(_0xb07ax3) / _0xb07ax6(_0xb07ax4) / _0xb07ax6(_0xb07ax3 - _0xb07ax4)
              },
              Factorial: (_0xb07ax4 = [1],
              function(_0xb07ax3) {
                  var _0xb07ax5 = 1;
                  if (_0xb07ax4[_0xb07ax3]) {
                      return _0xb07ax4[_0xb07ax3]
                  }
                  ;for (var _0xb07ax6 = _0xb07ax3; _0xb07ax6 > 1; _0xb07ax6--) {
                      _0xb07ax5 *= _0xb07ax6
                  }
                  ;return _0xb07ax4[_0xb07ax3] = _0xb07ax5,
                  _0xb07ax5
              }
              ),
              CatmullRom: function(_0xb07ax3, _0xb07ax4, _0xb07ax5, _0xb07ax6, _0xb07ax7) {
                  var _0xb07ax8 = 0.5 * (_0xb07ax5 - _0xb07ax3)
                    , _0xb07ax9 = 0.5 * (_0xb07ax6 - _0xb07ax4)
                    , _0xb07axa = _0xb07ax7 * _0xb07ax7;
                  return (2 * _0xb07ax4 - 2 * _0xb07ax5 + _0xb07ax8 + _0xb07ax9) * (_0xb07ax7 * _0xb07axa) + (-3 * _0xb07ax4 + 3 * _0xb07ax5 - 2 * _0xb07ax8 - _0xb07ax9) * _0xb07axa + _0xb07ax8 * _0xb07ax7 + _0xb07ax4
              }
          }
      },
      window['TWEEN'] = _0xb07ax5
  }(),
  pdfflip['createBlob'] = function(_0xb07ax3, _0xb07ax4) {
      if ('undefined' != typeof Blob) {
          return new Blob([_0xb07ax3],{
              type: _0xb07ax4
          })
      }
      ;var _0xb07ax5 = new MozBlobBuilder;
      return _0xb07ax5['append'](_0xb07ax3),
      _0xb07ax5['getBlob'](_0xb07ax4)
  }
  ,
  pdfflip['createObjectURL'] = function() {
      var _0xb07ax3 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      return function(_0xb07ax4, _0xb07ax5) {
          if ('undefined' != typeof URL && URL['createObjectURL']) {
              var _0xb07ax6 = pdfflip['createBlob'](_0xb07ax4, _0xb07ax5);
              return URL['createObjectURL'](_0xb07ax6)
          }
          ;for (var _0xb07ax7 = 'data:' + _0xb07ax5 + ';base64,', _0xb07ax8 = 0, _0xb07ax9 = _0xb07ax4['length']; _0xb07ax8 < _0xb07ax9; _0xb07ax8 += 3) {
              var _0xb07axa = 255 & _0xb07ax4[_0xb07ax8]
                , _0xb07axb = 255 & _0xb07ax4[_0xb07ax8 + 1]
                , _0xb07axc = 255 & _0xb07ax4[_0xb07ax8 + 2];
              _0xb07ax7 += _0xb07ax3[_0xb07axa >> 2] + _0xb07ax3[(3 & _0xb07axa) << 4 | _0xb07axb >> 4] + _0xb07ax3[_0xb07ax8 + 1 < _0xb07ax9 ? (15 & _0xb07axb) << 2 | _0xb07axc >> 6 : 64] + _0xb07ax3[_0xb07ax8 + 2 < _0xb07ax9 ? 63 & _0xb07axc : 64]
          }
          ;return _0xb07ax7
      }
  }();
  var ThumbList = function() {
      function _0xb07ax3(_0xb07ax4) {
          var _0xb07ax5 = _0xb07ax4 && _0xb07ax4['w'] + 'px' || '100%'
            , _0xb07ax6 = _0xb07ax4 && _0xb07ax4['h'] + 'px' || '100%'
            , _0xb07ax7 = this['itemHeight'] = _0xb07ax4['itemHeight'];
          this['items'] = _0xb07ax4['items'],
          this['generatorFn'] = _0xb07ax4['generatorFn'],
          this['totalRows'] = _0xb07ax4['totalRows'] || _0xb07ax4['items'] && _0xb07ax4['items']['length'],
          this['addFn'] = _0xb07ax4['addFn'],
          this['scrollFn'] = _0xb07ax4['scrollFn'];
          var _0xb07ax8 = _0xb07ax3['createScroller'](_0xb07ax7 * this['totalRows']);
          this['container'] = _0xb07ax3['createContainer'](_0xb07ax5, _0xb07ax6),
          this['container']['appendChild'](_0xb07ax8),
          this['screenItemsLen'] = Math['ceil'](_0xb07ax4['h'] / _0xb07ax7),
          this['offsetItems'] = this['screenItemsLen'],
          this['cachedItemsLen'] = this['screenItemsLen'] + 2 * this['offsetItems'],
          this._renderChunk(this['container'], 0);
          var _0xb07ax9 = this;
          _0xb07ax9['lastRepaintY'] = 0;
          this['screenItemsLen'];

          function _0xb07axa(_0xb07ax3) {
              var _0xb07ax4 = _0xb07ax3['target']['scrollTop'];
              if (!_0xb07ax9['lastRepaintY'] || Math['abs'](_0xb07ax4 - _0xb07ax9['lastRepaintY']) >= _0xb07ax9['offsetItems'] * _0xb07ax9['itemHeight']) {
                  var _0xb07ax5 = parseInt(_0xb07ax4 / _0xb07ax7, 10) - _0xb07ax9['offsetItems'];
                  _0xb07ax9._renderChunk(_0xb07ax9['container'], _0xb07ax5 < 0 ? 0 : _0xb07ax5),
                  _0xb07ax9['lastRepaintY'] = _0xb07ax4
              }
              ;_0xb07ax9['lastScrolled'] = Date['now'](),
              null != _0xb07ax9['scrollFn'] && _0xb07ax9['scrollFn'](),
              _0xb07ax3['preventDefault'] && _0xb07ax3['preventDefault']()
          }
          _0xb07ax9['dispose'] = function() {
              _0xb07ax9['container'] && _0xb07ax9['container']['parentNode'] && _0xb07ax9['container']['parentNode']['removeChild'](_0xb07ax9['container']),
              _0xb07ax9['container']['removeEventListener']('scroll', _0xb07axa)
          }
          ,
          _0xb07ax9['container']['addEventListener']('scroll', _0xb07axa)
      }
      return _0xb07ax3['prototype']['reset'] = function(_0xb07ax3) {
          this['screenItemsLen'] = Math['ceil'](_0xb07ax3 / this['itemHeight']),
          this['cachedItemsLen'] = this['screenItemsLen'] + 2 * this['offsetItems'];
          var _0xb07ax4 = parseInt(this['lastRepaintY'] / this['itemHeight'], 10) - this['offsetItems'];
          this['needReset'] = !0,
          this._renderChunk(this['container'], Math['max'](_0xb07ax4, 0))
      }
      ,
      _0xb07ax3['prototype']['createRow'] = function(_0xb07ax3) {
          var _0xb07ax4;
          return this['generatorFn'] && ((_0xb07ax4 = this['generatorFn'](_0xb07ax3))['classList']['add']('pdff-vrow'),
          _0xb07ax4['style']['position'] = 'absolute',
          _0xb07ax4['style']['top'] = _0xb07ax3 * this['itemHeight'] + 'px',
          _0xb07ax4['setAttribute']('index', _0xb07ax3)),
          _0xb07ax4
      }
      ,
      _0xb07ax3['prototype']['_renderChunk'] = function(_0xb07ax3, _0xb07ax4) {
          var _0xb07ax5 = null == this['range'];
          this['range'] = this['range'] || {
              min: 0,
              max: this['cachedItemsLen']
          };
          var _0xb07ax6 = this['range']
            , _0xb07ax7 = _0xb07ax6['min']
            , _0xb07ax8 = _0xb07ax6['max']
            , _0xb07ax9 = !!_0xb07ax5 || _0xb07ax4 >= _0xb07ax7;
          if (_0xb07ax5 || _0xb07ax4 != _0xb07ax7 || 0 != this['needReset']) {
              var _0xb07axa, _0xb07axb = _0xb07ax5 ? _0xb07ax7 : _0xb07ax9 ? _0xb07ax8 : _0xb07ax4;
              _0xb07axb = _0xb07axb > this['totalRows'] ? this['totalRows'] : _0xb07axb < 0 ? 0 : _0xb07axb;
              var _0xb07axc = _0xb07ax4 + this['cachedItemsLen'];
              for (_0xb07axc = _0xb07axc > this['totalRows'] ? this['totalRows'] : _0xb07axc,
              _0xb07axa = _0xb07axb; _0xb07axa < _0xb07axc; _0xb07axa++) {
                  _0xb07ax9 ? _0xb07ax3['appendChild'](this['createRow'](_0xb07axa)) : _0xb07ax3['insertBefore'](this['createRow'](_0xb07axa), _0xb07ax3['childNodes'][1 + _0xb07axa - _0xb07axb]),
                  null != this['addFn'] && this['addFn'](_0xb07axa)
              }
              ;Math['abs'](_0xb07ax4 - _0xb07ax7);
              if (this['needReset'] = !1,
              !_0xb07ax5 && _0xb07ax3['childNodes']['length'] > this['cachedItemsLen'] + 1) {
                  for (var _0xb07axd = _0xb07ax9 ? 1 : 1 + this['cachedItemsLen'], _0xb07axe = _0xb07axd + (_0xb07axc - _0xb07axb); _0xb07axe > _0xb07axd; _0xb07axe--) {
                      _0xb07ax3['childNodes'][_0xb07axd] && this['container']['removeChild'](_0xb07ax3['childNodes'][_0xb07axd])
                  }
              }
              ;this['range']['min'] = _0xb07ax4,
              this['range']['max'] = _0xb07axc
          }
      }
      ,
      _0xb07ax3['createContainer'] = function(_0xb07ax3, _0xb07ax4) {
          var _0xb07ax5 = document['createElement']('div');
          return _0xb07ax5['style']['width'] = _0xb07ax3,
          _0xb07ax5['style']['height'] = _0xb07ax4,
          _0xb07ax5['style']['overflow'] = 'auto',
          _0xb07ax5['style']['position'] = 'relative',
          _0xb07ax5['style']['padding'] = 0,
          _0xb07ax5
      }
      ,
      _0xb07ax3['createScroller'] = function(_0xb07ax3) {
          var _0xb07ax4 = document['createElement']('div');
          return _0xb07ax4['style']['opacity'] = 0,
          _0xb07ax4['style']['position'] = 'absolute',
          _0xb07ax4['style']['top'] = 0,
          _0xb07ax4['style']['left'] = 0,
          _0xb07ax4['style']['width'] = '1px',
          _0xb07ax4['style']['height'] = _0xb07ax3 + 'px',
          _0xb07ax4
      }
      ,
      _0xb07ax3
  }()
    , BookMarkViewer = function() {
      function _0xb07ax3(_0xb07ax3) {
          this['outline'] = null,
          this['lastToggleIsShow'] = !0,
          this['container'] = _0xb07ax3['container'],
          this['linkService'] = _0xb07ax3['linkService'],
          this['outlineItemClass'] = _0xb07ax3['outlineItemClass'] || 'outlineItem',
          this['outlineToggleClass'] = _0xb07ax3['outlineToggleClass'] || 'outlineItemToggler',
          this['outlineToggleHiddenClass'] = _0xb07ax3['outlineToggleHiddenClass'] || 'outlineItemsHidden'
      }
      return _0xb07ax3['prototype'] = {
          dispose: function() {
              this['container'] && this['container']['parentNode'] && this['container']['parentNode']['removeChild'](this['container']),
              this['linkService'] = null
          },
          reset: function() {
              this['outline'] = null,
              this['lastToggleIsShow'] = !0;
              for (var _0xb07ax3 = this['container']; _0xb07ax3['firstChild']; ) {
                  _0xb07ax3['removeChild'](_0xb07ax3['firstChild'])
              }
          },
          _dispatchEvent: function(_0xb07ax3) {
              var _0xb07ax4 = document['createEvent']('CustomEvent');
              _0xb07ax4['initCustomEvent']('outlineloaded', !0, !0, {
                  outlineCount: _0xb07ax3
              }),
              this['container']['dispatchEvent'](_0xb07ax4)
          },
          _bindLink: function(_0xb07ax3, _0xb07ax4) {
              var _0xb07ax5 = this['linkService'];
              if (1 == _0xb07ax4['custom']) {
                  _0xb07ax3['href'] = _0xb07ax5['getCustomDestinationHash'](_0xb07ax4['dest']),
                  _0xb07ax3['onclick'] = function(_0xb07ax3) {
                      return _0xb07ax5['customNavigateTo'](_0xb07ax4['dest']),
                      !1
                  }
              } else {
                  if (_0xb07ax4['url']) {
                      return void (PDFJS['addLinkAttributes'](_0xb07ax3, {
                          url: _0xb07ax4['url']
                      }))
                  }
                  ;_0xb07ax3['href'] = _0xb07ax5['getDestinationHash'](_0xb07ax4['dest']),
                  _0xb07ax3['onclick'] = function(_0xb07ax3) {
                      return _0xb07ax5['navigateTo'](_0xb07ax4['dest']),
                      !1
                  }
              }
          },
          _addToggleButton: function(_0xb07ax3) {
              var _0xb07ax4 = document['createElement']('div');
              _0xb07ax4['className'] = this['outlineToggleClass'] + ' ' + this['outlineToggleHiddenClass'],
              _0xb07ax4['onclick'] = function(_0xb07ax5) {
                  if (_0xb07ax5['stopPropagation'](),
                  _0xb07ax4['classList']['toggle'](this['outlineToggleHiddenClass']),
                  _0xb07ax5['shiftKey']) {
                      var _0xb07ax6 = !_0xb07ax4['classList']['contains'](this['outlineToggleHiddenClass']);
                      this._toggleOutlineItem(_0xb07ax3, _0xb07ax6)
                  }
              }
              ['bind'](this),
              _0xb07ax3['insertBefore'](_0xb07ax4, _0xb07ax3['firstChild'])
          },
          _toggleOutlineItem: function(_0xb07ax3, _0xb07ax4) {
              this['lastToggleIsShow'] = _0xb07ax4;
              for (var _0xb07ax5 = _0xb07ax3['querySelectorAll']('.' + this['outlineToggleClass']), _0xb07ax6 = 0, _0xb07ax7 = _0xb07ax5['length']; _0xb07ax6 < _0xb07ax7; ++_0xb07ax6) {
                  _0xb07ax5[_0xb07ax6]['classList'][_0xb07ax4 ? 'remove' : 'add'](this['outlineToggleHiddenClass'])
              }
          },
          toggleOutlineTree: function() {
              this['outline'] && this._toggleOutlineItem(this['container'], !this['lastToggleIsShow'])
          },
          render: function(_0xb07ax3) {
              var _0xb07ax4 = _0xb07ax3 && _0xb07ax3['outline'] || null
                , _0xb07ax5 = 0;
              if (this['outline'] && this['reset'](),
              this['outline'] = _0xb07ax4,
              _0xb07ax4) {
                  for (var _0xb07ax6 = document['createDocumentFragment'](), _0xb07ax7 = [{
                      parent: _0xb07ax6,
                      items: this['outline']
                  }], _0xb07ax8 = !1; _0xb07ax7['length'] > 0; ) {
                      for (var _0xb07ax9 = _0xb07ax7['shift'](), _0xb07axa = _0xb07ax9['custom'], _0xb07axb = 0, _0xb07axc = _0xb07ax9['items']['length']; _0xb07axb < _0xb07axc; _0xb07axb++) {
                          var _0xb07axd = _0xb07ax9['items'][_0xb07axb]
                            , _0xb07axe = document['createElement']('div');
                          _0xb07axe['className'] = this['outlineItemClass'];
                          var _0xb07axf = document['createElement']('a');
                          if (null == _0xb07axd['custom'] && null != _0xb07axa && (_0xb07axd['custom'] = _0xb07axa),
                          this._bindLink(_0xb07axf, _0xb07axd),
                          _0xb07axf['textContent'] = _0xb07axd['title']['replace'](/\x00/g, ''),
                          _0xb07axe['appendChild'](_0xb07axf),
                          _0xb07axd['items'] && _0xb07axd['items']['length'] > 0) {
                              _0xb07ax8 = !0,
                              this._addToggleButton(_0xb07axe);
                              var _0xb07ax10 = document['createElement']('div');
                              _0xb07ax10['className'] = this['outlineItemClass'] + 's',
                              _0xb07axe['appendChild'](_0xb07ax10),
                              _0xb07ax7['push']({
                                  parent: _0xb07ax10,
                                  custom: _0xb07axd['custom'],
                                  items: _0xb07axd['items']
                              })
                          }
                          ;_0xb07ax9['parent']['appendChild'](_0xb07axe),
                          _0xb07ax5++
                      }
                  }
                  ;_0xb07ax8 && (null != this['container']['classList'] ? this['container']['classList']['add'](this['outlineItemClass'] + 's') : null != this['container']['className'] && (this['container']['className'] += ' picWindow')),
                  this['container']['appendChild'](_0xb07ax6),
                  this._dispatchEvent(_0xb07ax5)
              }
          }
      },
      _0xb07ax3
  }()
    , DFLightBox = function(_0xb07ax3) {
      function _0xb07ax4(_0xb07ax4, _0xb07ax5) {
          this['duration'] = 300;
          var _0xb07ax6 = this;
          return _0xb07ax6['lightboxWrapper'] = _0xb07ax3('<div>')['addClass']('pdff-lightbox-wrapper'),
          _0xb07ax6['container'] = _0xb07ax3('<div>')['addClass']('pdff-container')['appendTo'](_0xb07ax6['lightboxWrapper']),
          _0xb07ax6['controls'] = _0xb07ax3('<div>')['addClass']('pdff-lightbox-controls')['appendTo'](_0xb07ax6['lightboxWrapper']),
          _0xb07ax6['closeButton'] = _0xb07ax3('<div>')['addClass']('pdff-lightbox-close pdff-ui-btn')['on']('click', function() {
              $('body')['css']('overflow', 'visible');
              _0xb07ax6['close'](_0xb07ax4)
          })['appendTo'](_0xb07ax6['controls']),
          _0xb07ax6['lightboxWrapper']['append'](_0xb07ax6['container']),
          _0xb07ax6
      }
      return _0xb07ax4['prototype']['show'] = function(_0xb07ax4) {
          return 0 == this['lightboxWrapper']['parent']()['length'] && _0xb07ax3('body')['append'](this['lightboxWrapper']),
          this['lightboxWrapper']['fadeIn'](this['duration'], _0xb07ax4),
          this
      }
      ,
      _0xb07ax4['prototype']['close'] = function(_0xb07ax3) {
          return this['lightboxWrapper']['fadeOut'](this['duration']),
          setTimeout(_0xb07ax3, this['duration']),
          this
      }
      ,
      _0xb07ax4
  }(jQuery);
  pdfflip['Share'] = function(_0xb07ax3) {
      function _0xb07ax4(_0xb07ax4, _0xb07ax5) {
          var _0xb07ax6 = this
            , _0xb07ax7 = '<div>'
            , _0xb07ax8 = 'pdff-share-button'
            , _0xb07ax9 = 'width=500,height=400';
          _0xb07ax6['isOpen'] = !1,
          _0xb07ax6['shareUrl'] = '',
          _0xb07ax6['wrapper'] = _0xb07ax3('<div class="pdff-share-wrapper" style="display: none;">')['on']('click', function(_0xb07ax3) {
              _0xb07ax6['close']()
          }),
          _0xb07ax6['box'] = _0xb07ax3('<div class="pdff-share-box">')['on']('click', function(_0xb07ax3) {
              _0xb07ax3['preventDefault'](),
              _0xb07ax3['stopPropagation']()
          })['appendTo'](_0xb07ax6['wrapper'])['html']('<span class="pdff-share-title">' + _0xb07ax5['text']['share'] + '</span>'),
          _0xb07ax6['urlInput'] = _0xb07ax3('<textarea class="pdff-share-url">')['on']('click', function() {
              _0xb07ax3(this)['select']()
          }),
          _0xb07ax6['facebook'] = _0xb07ax3(_0xb07ax7, {
              class: _0xb07ax8 + ' pdff-share-facebook ' + _0xb07ax5['icons']['facebook']
          })['on']('click', function(_0xb07ax3) {
              window['open']('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(_0xb07ax6['shareUrl']), 'Sharer', _0xb07ax9)
          }),
          _0xb07ax6['google'] = _0xb07ax3(_0xb07ax7, {
              class: _0xb07ax8 + ' pdff-share-google ' + _0xb07ax5['icons']['google']
          })['on']('click', function(_0xb07ax3) {
              window['open']('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(_0xb07ax6['shareUrl']), 'Sharer', _0xb07ax9)
          }),
          _0xb07ax6['twitter'] = _0xb07ax3(_0xb07ax7, {
              class: _0xb07ax8 + ' pdff-share-twitter ' + _0xb07ax5['icons']['twitter']
          })['on']('click', function(_0xb07ax3) {
              window['open']('http://twitter.com/share?url=' + encodeURIComponent(_0xb07ax6['shareUrl']), 'Sharer', _0xb07ax9)
          }),
          _0xb07ax6['mail'] = _0xb07ax3('<a>', {
              class: _0xb07ax8 + ' pdff-share-mail ' + _0xb07ax5['icons']['mail'],
              href: 'mailto:?subject=Check out this flipbook&body=Check out this site ' + encodeURIComponent(_0xb07ax6['shareUrl']),
              target: '_blank'
          })['on']('click', function(_0xb07ax4) {
              _0xb07ax3(this)['attr']('href', 'mailto:?subject=Check out this FlipBook&body=Check out this site ' + encodeURIComponent(_0xb07ax6['shareUrl'])),
              _0xb07ax4['stopPropagation']()
          }),
          _0xb07ax6['box']['append'](_0xb07ax6['urlInput'])['append'](_0xb07ax6['facebook'])['append'](_0xb07ax6['google'])['append'](_0xb07ax6['twitter'])['append'](_0xb07ax6['mail']),
          _0xb07ax3(_0xb07ax4)['append'](_0xb07ax6['wrapper'])
      }
      return _0xb07ax4['prototype']['show'] = function() {
          this['wrapper']['fadeIn'](300),
          this['urlInput']['val'](this['shareUrl']),
          this['urlInput']['trigger']('click'),
          this['isOpen'] = !0
      }
      ,
      _0xb07ax4['prototype']['dispose'] = function() {
          var _0xb07ax3 = this;
          _0xb07ax3['box']['off'](),
          _0xb07ax3['google']['off'](),
          _0xb07ax3['twitter']['off'](),
          _0xb07ax3['facebook']['off'](),
          _0xb07ax3['mail']['off'](),
          _0xb07ax3['urlInput']['off'](),
          _0xb07ax3['wrapper']['off']()['remove']()
      }
      ,
      _0xb07ax4['prototype']['close'] = function() {
          this['wrapper']['fadeOut'](300),
          this['isOpen'] = !1
      }
      ,
      _0xb07ax4['prototype']['update'] = function(_0xb07ax3) {
          this['shareUrl'] = _0xb07ax3
      }
      ,
      _0xb07ax4
  }(jQuery),
  pdfflip['Popup'] = function(_0xb07ax3) {
      function _0xb07ax4(_0xb07ax4, _0xb07ax5) {
          var _0xb07ax6 = this;
          _0xb07ax6['isOpen'] = !1,
          _0xb07ax6['wrapper'] = _0xb07ax3('<div class="pdff-popup-wrapper" style="display: none;">')['on']('click', function(_0xb07ax3) {
              _0xb07ax6['close']()
          }),
          _0xb07ax6['box'] = _0xb07ax3('<div class="pdff-popup-box">')['on']('click', function(_0xb07ax3) {
              _0xb07ax3['preventDefault'](),
              _0xb07ax3['stopPropagation']()
          })['appendTo'](_0xb07ax6['wrapper']),
          _0xb07ax3(_0xb07ax4)['append'](_0xb07ax6['wrapper'])
      }
      return _0xb07ax4['prototype']['show'] = function() {
          this['wrapper']['fadeIn'](300),
          this['isOpen'] = !0
      }
      ,
      _0xb07ax4['prototype']['dispose'] = function() {
          this['box']['off'](),
          this['wrapper']['off']()['remove']()
      }
      ,
      _0xb07ax4['prototype']['close'] = function() {
          this['wrapper']['fadeOut'](300),
          this['isOpen'] = !1
      }
      ,
      _0xb07ax4
  }(jQuery);
  var PDFLinkService = function() {
      function _0xb07ax3() {
          this['baseUrl'] = null,
          this['pdfDocument'] = null,
          this['pdfViewer'] = null,
          this['pdfHistory'] = null,
          this['_pagesRefCache'] = null
      }
      return _0xb07ax3['prototype'] = {
          dispose: function() {
              this['baseUrl'] = null,
              this['pdfDocument'] = null,
              this['pdfViewer'] = null,
              this['pdfHistory'] = null,
              this['_pagesRefCache'] = null
          },
          setDocument: function(_0xb07ax3, _0xb07ax4) {
              this['baseUrl'] = _0xb07ax4,
              this['pdfDocument'] = _0xb07ax3,
              this['_pagesRefCache'] = Object['create'](null)
          },
          setViewer: function(_0xb07ax3) {
              this['pdfViewer'] = _0xb07ax3
          },
          setHistory: function(_0xb07ax3) {
              this['pdfHistory'] = _0xb07ax3
          },
          get pagesCount() {
              return this['pdfDocument']['numPages']
          },
          get page() {
              return this['pdfViewer']['currentPageNumber']
          },
          set page(_0xb07ax3) {
              this['pdfViewer']['currentPageNumber'] = _0xb07ax3
          },
          navigateTo: function(_0xb07ax3) {
              var _0xb07ax4, _0xb07ax5 = '', _0xb07ax6 = this, _0xb07ax7 = function(_0xb07ax4) {
                  var _0xb07ax8 = _0xb07ax4 instanceof Object ? _0xb07ax6['_pagesRefCache'][_0xb07ax4['num'] + ' ' + _0xb07ax4['gen'] + ' R'] : _0xb07ax4 + 1;
                  _0xb07ax8 ? (_0xb07ax6['pdfViewer']['contentProvider']['options']['pageSize'] == pdfflip['PAGE_SIZE']['DOUBLEINTERNAL'] && _0xb07ax8 > 2 && (_0xb07ax8 = 2 * _0xb07ax8 - 1),
                  _0xb07ax8 > _0xb07ax6['pdfViewer']['pageCount'] && (_0xb07ax8 = _0xb07ax6['pdfViewer']['pageCount']),
                  _0xb07ax6['pdfViewer']['gotoPage'](_0xb07ax8),
                  _0xb07ax6['pdfHistory'] && _0xb07ax6['pdfHistory']['push']({
                      dest: _0xb07ax3,
                      hash: _0xb07ax5,
                      page: _0xb07ax8
                  })) : _0xb07ax6['pdfDocument']['getPageIndex'](_0xb07ax4)['then'](function(_0xb07ax3) {
                      var _0xb07ax5 = _0xb07ax3 + 1
                        , _0xb07ax8 = _0xb07ax4['num'] + ' ' + _0xb07ax4['gen'] + ' R';
                      _0xb07ax6['_pagesRefCache'][_0xb07ax8] = _0xb07ax5,
                      _0xb07ax7(_0xb07ax4)
                  })
              };
              'string' == typeof _0xb07ax3 ? (_0xb07ax5 = _0xb07ax3,
              _0xb07ax4 = this['pdfDocument']['getDestination'](_0xb07ax3)) : _0xb07ax4 = Promise['resolve'](_0xb07ax3),
              _0xb07ax4['then'](function(_0xb07ax4) {
                  _0xb07ax3 = _0xb07ax4,
                  _0xb07ax4 instanceof Array && _0xb07ax7(_0xb07ax4[0])
              })
          },
          customNavigateTo: function(_0xb07ax3) {
              if ('' != _0xb07ax3 && null != _0xb07ax3 && 'null' != _0xb07ax3) {
                  var _0xb07ax4 = null;
                  if (isNaN(Math['round'](_0xb07ax3))) {
                      if ('string' == typeof _0xb07ax3 && (_0xb07ax4 = parseInt(_0xb07ax3['replace']('#', ''), 10),
                      isNaN(_0xb07ax4))) {
                          return void (window['open'](_0xb07ax3))
                      }
                  } else {
                      _0xb07ax4 = _0xb07ax3
                  }
                  ;null != _0xb07ax4 && this['pdfViewer']['gotoPage'](_0xb07ax4)
              }
          },
          getDestinationHash: function(_0xb07ax3) {
              if ('string' == typeof _0xb07ax3) {
                  return this['getAnchorUrl']('#' + escape(_0xb07ax3))
              }
              ;if (_0xb07ax3 instanceof Array) {
                  var _0xb07ax4 = _0xb07ax3[0]
                    , _0xb07ax5 = _0xb07ax4 instanceof Object ? this['_pagesRefCache'][_0xb07ax4['num'] + ' ' + _0xb07ax4['gen'] + ' R'] : _0xb07ax4 + 1;
                  if (_0xb07ax5) {
                      var _0xb07ax6 = this['getAnchorUrl']('#page=' + _0xb07ax5)
                        , _0xb07ax7 = _0xb07ax3[1];
                      if ('object' == typeof _0xb07ax7 && 'name'in _0xb07ax7 && 'XYZ' === _0xb07ax7['name']) {
                          var _0xb07ax8 = _0xb07ax3[4] || this['pdfViewer']['currentScaleValue']
                            , _0xb07ax9 = parseFloat(_0xb07ax8);
                          _0xb07ax9 && (_0xb07ax8 = 100 * _0xb07ax9),
                          _0xb07ax6 += '&zoom=' + _0xb07ax8,
                          (_0xb07ax3[2] || _0xb07ax3[3]) && (_0xb07ax6 += ',' + (_0xb07ax3[2] || 0) + ',' + (_0xb07ax3[3] || 0))
                      }
                      ;return _0xb07ax6
                  }
              }
              ;return this['getAnchorUrl']('')
          },
          getCustomDestinationHash: function(_0xb07ax3) {
              return '#' + escape(_0xb07ax3)
          },
          getAnchorUrl: function(_0xb07ax3) {
              return (this['baseUrl'] || '') + _0xb07ax3
          },
          setHash: function(_0xb07ax3) {
              if (_0xb07ax3['indexOf']('=') >= 0) {
                  var _0xb07ax4, _0xb07ax5, _0xb07ax6 = parseQueryString(_0xb07ax3);
                  if ('nameddest'in _0xb07ax6) {
                      return this['pdfHistory'] && this['pdfHistory']['updateNextHashParam'](_0xb07ax6['nameddest']),
                      void (this['navigateTo'](_0xb07ax6['nameddest']))
                  }
                  ;if ('page'in _0xb07ax6 && (_0xb07ax4 = 0 | _0xb07ax6['page'] || 1),
                  'zoom'in _0xb07ax6) {
                      var _0xb07ax7 = _0xb07ax6['zoom']['split'](',')
                        , _0xb07ax8 = _0xb07ax7[0]
                        , _0xb07ax9 = parseFloat(_0xb07ax8);
                      -1 === _0xb07ax8['indexOf']('Fit') ? _0xb07ax5 = [null, {
                          name: 'XYZ'
                      }, _0xb07ax7['length'] > 1 ? 0 | _0xb07ax7[1] : null, _0xb07ax7['length'] > 2 ? 0 | _0xb07ax7[2] : null, _0xb07ax9 ? _0xb07ax9 / 100 : _0xb07ax8] : 'Fit' === _0xb07ax8 || 'FitB' === _0xb07ax8 ? _0xb07ax5 = [null, {
                          name: _0xb07ax8
                      }] : 'FitH' === _0xb07ax8 || 'FitBH' === _0xb07ax8 || 'FitV' === _0xb07ax8 || 'FitBV' === _0xb07ax8 ? _0xb07ax5 = [null, {
                          name: _0xb07ax8
                      }, _0xb07ax7['length'] > 1 ? 0 | _0xb07ax7[1] : null] : 'FitR' === _0xb07ax8 ? 5 !== _0xb07ax7['length'] ? console['error']('PDFLinkService_setHash: Not enough parameters for \'FitR\'.') : _0xb07ax5 = [null, {
                          name: _0xb07ax8
                      }, 0 | _0xb07ax7[1], 0 | _0xb07ax7[2], 0 | _0xb07ax7[3], 0 | _0xb07ax7[4]] : console['error']('PDFLinkService_setHash: \'' + _0xb07ax8 + '\' is not a valid zoom value.')
                  }
                  ;if (_0xb07ax5 ? this['pdfViewer']['scrollPageIntoView'](_0xb07ax4 || this['page'], _0xb07ax5) : _0xb07ax4 && (this['page'] = _0xb07ax4),
                  'pagemode'in _0xb07ax6) {
                      var _0xb07axa = document['createEvent']('CustomEvent');
                      _0xb07axa['initCustomEvent']('pagemode', !0, !0, {
                          mode: _0xb07ax6['pagemode']
                      }),
                      this['pdfViewer']['container']['dispatchEvent'](_0xb07axa)
                  }
              } else {
                  /^\d+$/['test'](_0xb07ax3) ? this['page'] = _0xb07ax3 : (this['pdfHistory'] && this['pdfHistory']['updateNextHashParam'](unescape(_0xb07ax3)),
                  this['navigateTo'](unescape(_0xb07ax3)))
              }
          },
          executeNamedAction: function(_0xb07ax3) {
              switch (_0xb07ax3) {
              case 'GoBack':
                  this['pdfHistory'] && this['pdfHistory']['back']();
                  break;
              case 'GoForward':
                  this['pdfHistory'] && this['pdfHistory']['forward']();
                  break;
              case 'NextPage':
                  this['page']++;
                  break;
              case 'PrevPage':
                  this['page']--;
                  break;
              case 'LastPage':
                  this['page'] = this['pagesCount'];
                  break;
              case 'FirstPage':
                  this['page'] = 1
              }
              ;var _0xb07ax4 = document['createEvent']('CustomEvent');
              _0xb07ax4['initCustomEvent']('namedaction', !0, !0, {
                  action: _0xb07ax3
              }),
              this['pdfViewer']['container']['dispatchEvent'](_0xb07ax4)
          },
          cachePageRef: function(_0xb07ax3, _0xb07ax4) {
              var _0xb07ax5 = _0xb07ax4['num'] + ' ' + _0xb07ax4['gen'] + ' R';
              this['_pagesRefCache'][_0xb07ax5] = _0xb07ax3
          }
      },
      _0xb07ax3
  }();
  pdfflip['TextLayerBuilder'] = function() {
      function _0xb07ax3(_0xb07ax3) {
          this['textLayerDiv'] = _0xb07ax3['textLayerDiv'],
          this['renderingDone'] = !1,
          this['divContentDone'] = !1,
          this['pageIdx'] = _0xb07ax3['pageIndex'],
          this['pageNumber'] = this['pageIdx'] + 1,
          this['matches'] = [],
          this['viewport'] = _0xb07ax3['viewport'],
          this['textDivs'] = [],
          this['findController'] = _0xb07ax3['findController'] || null,
          this['textLayerRenderTask'] = null,
          this['enhanceTextSelection'] = _0xb07ax3['enhanceTextSelection'],
          this._bindMouse()
      }
      return _0xb07ax3['prototype'] = {
          _finishRendering: function() {
              if (this['renderingDone'] = !0,
              !this['enhanceTextSelection']) {
                  var _0xb07ax3 = document['createElement']('div');
                  _0xb07ax3['className'] = 'endOfContent',
                  this['textLayerDiv']['appendChild'](_0xb07ax3)
              }
          },
          render: function(_0xb07ax3) {
              if (this['divContentDone'] && !this['renderingDone']) {
                  this['textLayerRenderTask'] && (this['textLayerRenderTask']['cancel'](),
                  this['textLayerRenderTask'] = null),
                  this['textDivs'] = [];
                  var _0xb07ax4 = document['createDocumentFragment']();
                  this['textLayerRenderTask'] = PDFJS['renderTextLayer']({
                      textContent: this['textContent'],
                      container: _0xb07ax4,
                      viewport: this['viewport'],
                      textDivs: this['textDivs'],
                      timeout: _0xb07ax3,
                      enhanceTextSelection: this['enhanceTextSelection']
                  }),
                  this['textLayerRenderTask']['promise']['then'](function() {
                      this['textLayerDiv']['appendChild'](_0xb07ax4),
                      this._finishRendering(),
                      this['updateMatches']()
                  }
                  ['bind'](this), function(_0xb07ax3) {})
              }
          },
          setTextContent: function(_0xb07ax3) {
              this['textLayerRenderTask'] && (this['textLayerRenderTask']['cancel'](),
              this['textLayerRenderTask'] = null),
              this['textContent'] = _0xb07ax3,
              this['divContentDone'] = !0
          },
          convertMatches: function(_0xb07ax3, _0xb07ax4) {
              var _0xb07ax5 = 0
                , _0xb07ax6 = 0
                , _0xb07ax7 = this['textContent']['items']
                , _0xb07ax8 = _0xb07ax7['length'] - 1
                , _0xb07ax9 = null === this['findController'] ? 0 : this['findController']['state']['query']['length']
                , _0xb07axa = [];
              if (!_0xb07ax3) {
                  return _0xb07axa
              }
              ;for (var _0xb07axb = 0, _0xb07axc = _0xb07ax3['length']; _0xb07axb < _0xb07axc; _0xb07axb++) {
                  for (var _0xb07axd = _0xb07ax3[_0xb07axb]; _0xb07ax5 !== _0xb07ax8 && _0xb07axd >= _0xb07ax6 + _0xb07ax7[_0xb07ax5]['str']['length']; ) {
                      _0xb07ax6 += _0xb07ax7[_0xb07ax5]['str']['length'],
                      _0xb07ax5++
                  }
                  ;_0xb07ax5 === _0xb07ax7['length'] && console['error']('Could not find a matching mapping');
                  var _0xb07axe = {
                      begin: {
                          divIdx: _0xb07ax5,
                          offset: _0xb07axd - _0xb07ax6
                      }
                  };
                  for (_0xb07axd += _0xb07ax4 ? _0xb07ax4[_0xb07axb] : _0xb07ax9; _0xb07ax5 !== _0xb07ax8 && _0xb07axd > _0xb07ax6 + _0xb07ax7[_0xb07ax5]['str']['length']; ) {
                      _0xb07ax6 += _0xb07ax7[_0xb07ax5]['str']['length'],
                      _0xb07ax5++
                  }
                  ;_0xb07axe['end'] = {
                      divIdx: _0xb07ax5,
                      offset: _0xb07axd - _0xb07ax6
                  },
                  _0xb07axa['push'](_0xb07axe)
              }
              ;return _0xb07axa
          },
          renderMatches: function(_0xb07ax3) {
              if (0 !== _0xb07ax3['length']) {
                  var _0xb07ax4 = this['textContent']['items']
                    , _0xb07ax5 = this['textDivs']
                    , _0xb07ax6 = null
                    , _0xb07ax7 = this['pageIdx']
                    , _0xb07ax8 = null !== this['findController'] && _0xb07ax7 === this['findController']['selected']['pageIdx']
                    , _0xb07ax9 = null === this['findController'] ? -1 : this['findController']['selected']['matchIdx']
                    , _0xb07axa = {
                      divIdx: -1,
                      offset: void (0)
                  }
                    , _0xb07axb = _0xb07ax9
                    , _0xb07axc = _0xb07axb + 1;
                  if (null !== this['findController'] && this['findController']['state']['highlightAll']) {
                      _0xb07axb = 0,
                      _0xb07axc = _0xb07ax3['length']
                  } else {
                      if (!_0xb07ax8) {
                          return
                      }
                  }
                  ;for (var _0xb07axd = _0xb07axb; _0xb07axd < _0xb07axc; _0xb07axd++) {
                      var _0xb07axe = _0xb07ax3[_0xb07axd]
                        , _0xb07axf = _0xb07axe['begin']
                        , _0xb07ax10 = _0xb07axe['end']
                        , _0xb07ax11 = _0xb07ax8 && _0xb07axd === _0xb07ax9 ? ' selected' : '';
                      if (this['findController'] && this['findController']['updateMatchPosition'](_0xb07ax7, _0xb07axd, _0xb07ax5, _0xb07axf['divIdx']),
                      _0xb07ax6 && _0xb07axf['divIdx'] === _0xb07ax6['divIdx'] ? _0xb07ax15(_0xb07ax6['divIdx'], _0xb07ax6['offset'], _0xb07axf['offset']) : (null !== _0xb07ax6 && _0xb07ax15(_0xb07ax6['divIdx'], _0xb07ax6['offset'], _0xb07axa['offset']),
                      _0xb07ax14(_0xb07axf)),
                      _0xb07axf['divIdx'] === _0xb07ax10['divIdx']) {
                          _0xb07ax15(_0xb07axf['divIdx'], _0xb07axf['offset'], _0xb07ax10['offset'], 'highlight' + _0xb07ax11)
                      } else {
                          _0xb07ax15(_0xb07axf['divIdx'], _0xb07axf['offset'], _0xb07axa['offset'], 'highlight begin' + _0xb07ax11);
                          for (var _0xb07ax12 = _0xb07axf['divIdx'] + 1, _0xb07ax13 = _0xb07ax10['divIdx']; _0xb07ax12 < _0xb07ax13; _0xb07ax12++) {
                              _0xb07ax5[_0xb07ax12]['className'] = 'highlight middle' + _0xb07ax11
                          }
                          ;_0xb07ax14(_0xb07ax10, 'highlight end' + _0xb07ax11)
                      }
                      ;_0xb07ax6 = _0xb07ax10
                  }
                  ;_0xb07ax6 && _0xb07ax15(_0xb07ax6['divIdx'], _0xb07ax6['offset'], _0xb07axa['offset'])
              }
              ;
              function _0xb07ax14(_0xb07ax3, _0xb07ax4) {
                  var _0xb07ax6 = _0xb07ax3['divIdx'];
                  _0xb07ax5[_0xb07ax6]['textContent'] = '',
                  _0xb07ax15(_0xb07ax6, 0, _0xb07ax3['offset'], _0xb07ax4)
              }

              function _0xb07ax15(_0xb07ax3, _0xb07ax6, _0xb07ax7, _0xb07ax8) {
                  var _0xb07ax9 = _0xb07ax5[_0xb07ax3]
                    , _0xb07axa = _0xb07ax4[_0xb07ax3]['str']['substring'](_0xb07ax6, _0xb07ax7)
                    , _0xb07axb = document['createTextNode'](_0xb07axa);
                  if (_0xb07ax8) {
                      var _0xb07axc = document['createElement']('span');
                      return _0xb07axc['className'] = _0xb07ax8,
                      _0xb07axc['appendChild'](_0xb07axb),
                      void (_0xb07ax9['appendChild'](_0xb07axc))
                  }
                  ;_0xb07ax9['appendChild'](_0xb07axb)
              }
          },
          updateMatches: function() {
              if (this['renderingDone']) {
                  for (var _0xb07ax3, _0xb07ax4, _0xb07ax5 = this['matches'], _0xb07ax6 = this['textDivs'], _0xb07ax7 = this['textContent']['items'], _0xb07ax8 = -1, _0xb07ax9 = 0, _0xb07axa = _0xb07ax5['length']; _0xb07ax9 < _0xb07axa; _0xb07ax9++) {
                      for (var _0xb07axb = _0xb07ax5[_0xb07ax9], _0xb07axc = Math['max'](_0xb07ax8, _0xb07axb['begin']['divIdx']), _0xb07axd = _0xb07axb['end']['divIdx']; _0xb07axc <= _0xb07axd; _0xb07axc++) {
                          var _0xb07axe = _0xb07ax6[_0xb07axc];
                          _0xb07axe['textContent'] = _0xb07ax7[_0xb07axc]['str'],
                          _0xb07axe['className'] = ''
                      }
                      ;_0xb07ax8 = _0xb07axb['end']['divIdx'] + 1
                  }
                  ;if (null !== this['findController'] && this['findController']['active']) {
                      null !== this['findController'] && (_0xb07ax3 = this['findController']['pageMatches'][this['pageIdx']] || null,
                      _0xb07ax4 = this['findController']['pageMatchesLength'] && this['findController']['pageMatchesLength'][this['pageIdx']] || null),
                      this['matches'] = this['convertMatches'](_0xb07ax3, _0xb07ax4),
                      this['renderMatches'](this['matches'])
                  }
              }
          },
          _bindMouse: function() {
              var _0xb07ax3 = this['textLayerDiv']
                , _0xb07ax4 = this;
              _0xb07ax3['addEventListener']('mousedown', function(_0xb07ax5) {
                  if (_0xb07ax4['enhanceTextSelection'] && _0xb07ax4['textLayerRenderTask']) {
                      _0xb07ax4['textLayerRenderTask']['expandTextDivs'](!0)
                  } else {
                      var _0xb07ax6 = _0xb07ax3['querySelector']('.endOfContent');
                      if (_0xb07ax6) {
                          var _0xb07ax7 = _0xb07ax5['target'] !== _0xb07ax3;
                          if (_0xb07ax7 = _0xb07ax7 && 'none' !== window['getComputedStyle'](_0xb07ax6)['getPropertyValue']('-moz-user-select')) {
                              var _0xb07ax8 = _0xb07ax3['getBoundingClientRect']()
                                , _0xb07ax9 = Math['max'](0, (_0xb07ax5['pageY'] - _0xb07ax8['top']) / _0xb07ax8['height']);
                              _0xb07ax6['style']['top'] = (100 * _0xb07ax9)['toFixed'](2) + '%'
                          }
                          ;_0xb07ax6['classList']['add']('active')
                      }
                  }
              }),
              _0xb07ax3['addEventListener']('mouseup', function(_0xb07ax5) {
                  if (_0xb07ax4['enhanceTextSelection'] && _0xb07ax4['textLayerRenderTask']) {
                      _0xb07ax4['textLayerRenderTask']['expandTextDivs'](!1)
                  } else {
                      var _0xb07ax6 = _0xb07ax3['querySelector']('.endOfContent');
                      _0xb07ax6 && (_0xb07ax6['style']['top'] = '',
                      _0xb07ax6['classList']['remove']('active'))
                  }
              })
          }
      },
      _0xb07ax3
  }(),
  pdfflip['ConvertPageLinks'] = function() {
      for (var _0xb07ax3, _0xb07ax4 = arguments[0] / 100, _0xb07ax5 = arguments[1] / 100, _0xb07ax6 = function(_0xb07ax3, _0xb07ax6, _0xb07ax7, _0xb07ax8, _0xb07ax9) {
          return {
              x: _0xb07ax3 / _0xb07ax4,
              y: _0xb07ax6 / _0xb07ax5,
              w: _0xb07ax7 / _0xb07ax4,
              h: _0xb07ax8 / _0xb07ax5,
              dest: _0xb07ax9
          }
      }, _0xb07ax7 = [], _0xb07ax8 = 2; _0xb07ax8 < arguments['length']; _0xb07ax8++) {
          _0xb07ax3 = arguments[_0xb07ax8],
          _0xb07ax7[_0xb07ax8 - 2] = _0xb07ax6['apply'](this, _0xb07ax3)
      }
      ;return _0xb07ax7
  }
  ,
  pdfflip['parseLinks'] = function(_0xb07ax3) {
      var _0xb07ax4;
      if (null != _0xb07ax3 && _0xb07ax3['length'] > 0) {
          for (var _0xb07ax5 = 0; _0xb07ax5 < _0xb07ax3['length']; _0xb07ax5++) {
              null != (_0xb07ax4 = _0xb07ax3[_0xb07ax5]) && null != _0xb07ax4[0] && null == _0xb07ax4[0]['dest'] && (_0xb07ax4 = pdfflip['ConvertPageLinks']['apply'](this, _0xb07ax4),
              _0xb07ax3[_0xb07ax5] = _0xb07ax4)
          }
      }
      ;return _0xb07ax3
  }
  ,
  function(_0xb07ax3) {
      function _0xb07ax4(_0xb07ax3) {
          return 'true' == _0xb07ax3 || 1 == _0xb07ax3
      }

      function _0xb07ax5(_0xb07ax3) {
          null != _0xb07ax3['webgl'] && (_0xb07ax3['webgl'] = _0xb07ax4(_0xb07ax3['webgl'])),
          null != _0xb07ax3['downloadEnable'] && (_0xb07ax3['downloadEnable'] = _0xb07ax4(_0xb07ax3['downloadEnable'])),
          null != _0xb07ax3['scrollWheel'] && (_0xb07ax3['scrollWheel'] = _0xb07ax4(_0xb07ax3['scrollWheel'])),
          null != _0xb07ax3['autoEnableOutline'] && (_0xb07ax3['autoEnableOutline'] = _0xb07ax4(_0xb07ax3['autoEnableOutline'])),
          null != _0xb07ax3['autoEnableThumbnail'] && (_0xb07ax3['autoEnableThumbnail'] = _0xb07ax4(_0xb07ax3['autoEnableThumbnail'])),
          null != _0xb07ax3['transparent'] && (_0xb07ax3['transparent'] = _0xb07ax4(_0xb07ax3['transparent'])),
          null != _0xb07ax3['overwritePDFOutline'] && (_0xb07ax3['overwritePDFOutline'] = _0xb07ax4(_0xb07ax3['overwritePDFOutline'])),
          null != _0xb07ax3['enableSound'] && (_0xb07ax3['enableSound'] = _0xb07ax4(_0xb07ax3['enableSound'])),
          null != _0xb07ax3['forceFit'] && (_0xb07ax3['forceFit'] = _0xb07ax4(_0xb07ax3['forceFit'])),
          null != _0xb07ax3['enableAnnotation'] && (_0xb07ax3['enableAnnotation'] = _0xb07ax4(_0xb07ax3['enableAnnotation'])),
          null != _0xb07ax3['webglShadow'] && (_0xb07ax3['webglShadow'] = _0xb07ax4(_0xb07ax3['webglShadow'])),
          null != _0xb07ax3['autoPlay'] && (_0xb07ax3['autoPlay'] = _0xb07ax4(_0xb07ax3['autoPlay'])),
          null != _0xb07ax3['autoPlayStart'] && (_0xb07ax3['autoPlayStart'] = _0xb07ax4(_0xb07ax3['autoPlayStart'])),
          null != _0xb07ax3['paddingTop'] && (_0xb07ax3['paddingTop'] = parseInt(_0xb07ax3['paddingTop'], 10)),
          null != _0xb07ax3['paddingRight'] && (_0xb07ax3['paddingRight'] = parseInt(_0xb07ax3['paddingRight'], 10)),
          null != _0xb07ax3['paddingBottom'] && (_0xb07ax3['paddingBottom'] = parseInt(_0xb07ax3['paddingBottom'], 10)),
          null != _0xb07ax3['paddingLeft'] && (_0xb07ax3['paddingLeft'] = parseInt(_0xb07ax3['paddingLeft'], 10)),
          null != _0xb07ax3['zoomRatio'] && (_0xb07ax3['zoomRatio'] = parseFloat(_0xb07ax3['zoomRatio'], 10)),
          null != _0xb07ax3['stiffness'] && (_0xb07ax3['stiffness'] = parseFloat(_0xb07ax3['stiffness'], 10)),
          null != _0xb07ax3['autoPlayDuration'] && (_0xb07ax3['autoPlayDuration'] = parseInt(_0xb07ax3['autoPlayDuration'], 10)),
          0 != _0xb07ax3['pageMode'] && '0' != _0xb07ax3['pageMode'] || (_0xb07ax3['pageMode'] = null),
          0 != _0xb07ax3['singlePageMode'] && '0' != _0xb07ax3['singlePageMode'] || (_0xb07ax3['singlePageMode'] = null)
      }
      pdfflip['getOptions'] = function(_0xb07ax4) {
          var _0xb07ax6 = 'option_' + (_0xb07ax4 = _0xb07ax3(_0xb07ax4))['attr']('id')
            , _0xb07ax7 = _0xb07ax4['attr']('source') || _0xb07ax4['attr']('pdff-source');
          (_0xb07ax6 = null == _0xb07ax6 || '' == _0xb07ax6 || null == window[_0xb07ax6] ? {} : window[_0xb07ax6])['source'] = null == _0xb07ax7 || '' == _0xb07ax7 ? _0xb07ax6['source'] : _0xb07ax7;
          var _0xb07ax8 = {
              webgl: _0xb07ax4['attr']('webgl'),
              height: _0xb07ax4['attr']('height'),
              enableSound: _0xb07ax4['attr']('sound'),
              transparent: _0xb07ax4['attr']('transparent'),
              downloadEnable: false,
              duration: _0xb07ax4['attr']('duration'),
              hard: _0xb07ax4['attr']('hard'),
              pageMode: _0xb07ax4['attr']('pagemode'),
              direction: _0xb07ax4['attr']('direction'),
              backgroundColor: _0xb07ax4['attr']('backgroundcolor'),
              scrollWheel: _0xb07ax4['attr']('scrollwheel'),
              backgroundImage: _0xb07ax4['attr']('backgroundimage'),
              paddingTop: _0xb07ax4['attr']('paddingtop'),
              paddingRight: _0xb07ax4['attr']('paddingright'),
              paddingBottom: _0xb07ax4['attr']('paddingbottom'),
              paddingLeft: _0xb07ax4['attr']('paddingleft'),
              wpOptions: _0xb07ax4['attr']('wpoptions')
          };
          return function(_0xb07ax3) {
              if (1 != _0xb07ax3['parsed']) {
                  _0xb07ax3['parsed'] = !0;
                  var _0xb07ax4 = [];
                  if (_0xb07ax5(_0xb07ax3),
                  'undefined' != typeof pdfflipWPGlobal && 'true' == _0xb07ax3['wpOptions']) {
                      try {
                          for (var _0xb07ax6 in _0xb07ax3['links']) {
                              for (var _0xb07ax7 = _0xb07ax3['links'][_0xb07ax6], _0xb07ax8 = [100, 100], _0xb07ax9 = 0; _0xb07ax9 < _0xb07ax7['length']; _0xb07ax9++) {
                                  for (var _0xb07axa = _0xb07ax7[_0xb07ax9]['substr'](1)['slice'](0, -1)['split'](','), _0xb07axb = [], _0xb07axc = 0; _0xb07axc < 5; _0xb07axc++) {
                                      _0xb07axb[_0xb07axc] = _0xb07axa[_0xb07axc]
                                  }
                                  ;_0xb07ax8['push'](_0xb07axb)
                              }
                              ;_0xb07ax4[parseInt(_0xb07ax6, 10) + 1] = _0xb07ax8
                          }
                      } catch (_0xb07ax3) {
                          console['error'](_0xb07ax3['stack'])
                      }
                      ;_0xb07ax3['links'] = pdfflip['parseLinks'](_0xb07ax4)
                  } else {
                      _0xb07ax3['links'] = pdfflip['parseLinks'](_0xb07ax3['links'])
                  }
              }
          }(_0xb07ax6 = _0xb07ax3['extend'](!0, {}, _0xb07ax6, _0xb07ax8)),
          _0xb07ax6
      }
      ,
      pdfflip['parseBooks'] = function() {
          _0xb07ax3('._PDFF_btt, ._pdff_thumb, ._PDFF_link, .PDFFlip')['each'](function() {
              var _0xb07ax4 = _0xb07ax3(this);
              if ('true' !== (_0xb07ax4['attr']('parsed') || _0xb07ax4['attr']('pdff-parsed'))) {
                  if (_0xb07ax4['attr']('pdff-parsed', 'true'),
                  _0xb07ax4['hasClass']('PDFFlip')) {
                      var _0xb07ax5 = _0xb07ax4['attr']('id')
                        , _0xb07ax6 = _0xb07ax4['attr']('slug')
                        , _0xb07ax7 = pdfflip['getOptions'](_0xb07ax4);
                      _0xb07ax7['id'] = _0xb07ax5,
                      null != _0xb07ax6 && (_0xb07ax7['slug'] = _0xb07ax6),
                      _0xb07ax5 ? window[_0xb07ax5.toString()] = _0xb07ax3(_0xb07ax4)['flipBook'](_0xb07ax7['source'], _0xb07ax7) : _0xb07ax3(_0xb07ax4)['flipBook'](_0xb07ax7['source'], _0xb07ax7)
                  } else {
                      if (_0xb07ax4['hasClass']('_pdff_thumb')) {
                          var _0xb07ax8 = _0xb07ax3('<div class=\'PDFFlip-cover\'>')
                            , _0xb07ax9 = _0xb07ax4['html']()['trim']();
                          _0xb07ax4['html']('');
                          _0xb07ax3('<span class=\'PDFFlip-title\'>')['html'](_0xb07ax9)['appendTo'](_0xb07ax8);
                          var _0xb07axa = _0xb07ax4['attr']('thumb') || _0xb07ax4['attr']('pdff-thumb')
                            , _0xb07axb = _0xb07ax4['attr']('thumbtype') || pdfflip['defaults']['thumbElement'] || 'div'
                            , _0xb07axc = _0xb07ax4['attr']('tags') || _0xb07ax4['attr']('pdff-tags');
                          if (_0xb07axc && (_0xb07axc = _0xb07axc['split'](','))['length'] > 0) {
                              for (var _0xb07axd = 0; _0xb07axd < _0xb07axc['length']; _0xb07axd++) {
                                  _0xb07ax4['append']('<span class=\'PDFFlip-tag\'>' + _0xb07axc[_0xb07axd] + '</span>')
                              }
                          }
                          ;null != _0xb07axa && '' != _0xb07axa.toString()['trim']() ? 'img' == _0xb07axb ? (_0xb07ax8['append']('<img src="' + _0xb07axa + '" alt="' + _0xb07ax9 + '"/>'),
                          _0xb07ax4['attr']('thumb-type', 'img')) : _0xb07ax8['css']({
                              backgroundImage: 'url(' + _0xb07axa + ')'
                          }) : _0xb07ax8['addClass']('_pdff_thumb-not-found'),
                          _0xb07ax4['append'](_0xb07ax8)
                      }
                  }
              }
          })
      }
      ,
      _0xb07ax3(document)['ready'](function() {
          if ('undefined' == typeof pdfflipLocation && 0 != pdfflip['autoDetectLocation'] && _0xb07ax3('script')['each'](function() {
              var _0xb07ax4 = _0xb07ax3(this)[0]['src'];
              if ((_0xb07ax4['indexOf']('/pdfflip.js') > -1 || _0xb07ax4['indexOf']('/pdfflip.min.js') > -1) && (_0xb07ax4['indexOf']('https://') > -1 || _0xb07ax4['indexOf']('http://') > -1) && _0xb07ax4['indexOf']('js/pdfflip.') > -1) {
                  var _0xb07ax5 = _0xb07ax4['split']('/');
                  window['pdfflipLocation'] = _0xb07ax5['slice'](0, -2)['join']('/')
              }
          }),
          'undefined' != typeof pdfflipLocation && (pdfflipLocation['length'] > 2 && '/' !== pdfflipLocation['slice'](-1) && (window['pdfflipLocation'] += '/'),
          pdfflip['defaults']['utilsSrc'] = pdfflipLocation + 'js/libs/utils.min.js',
          pdfflip['defaults']['pdfjsSrc'] = pdfflipLocation + 'js/libs/pdf.min.js',
          pdfflip['defaults']['pdfjsCompatibilitySrc'] = pdfflipLocation + 'js/libs/compatibility.js',
          pdfflip['defaults']['threejsSrc'] = pdfflipLocation + 'js/libs/three.min.js',
          pdfflip['defaults']['pdfjsWorkerSrc'] = pdfflipLocation + 'js/libs/pdf.worker.min.js',
          pdfflip['defaults']['soundFile'] = pdfflipLocation + 'sound/turn.mp3',
          pdfflip['defaults']['imagesLocation'] = pdfflipLocation + 'images',
          pdfflip['defaults']['imageResourcesPath'] = pdfflipLocation + 'images/pdfjs/',
          pdfflip['defaults']['cMapUrl'] = pdfflipLocation + 'js/libs/cmaps/',
          'undefined' != typeof pdfflipWPGlobal && (_0xb07ax5(pdfflipWPGlobal),
          _0xb07ax3['extend'](pdfflip['defaults'], pdfflipWPGlobal))),
          pdfflip['preParseHash'] = window['location']['hash'],
          pdfflip['parseBooks'](),
          _0xb07ax3('body')['on']('click', '._PDFF_btt, ._pdff_thumb, ._PDFF_link', function() {
              $('body')['css']('overflow', 'hidden');
              var _0xb07ax4 = _0xb07ax3(this);
              window['dfLightBox'] || (window['dfLightBox'] = new DFLightBox(function() {
                  0 == window['location']['hash']['indexOf']('#pdfflip-') && (window['location']['hash'] = '#_'),
                  window['dfActiveLightBoxBook']['dispose'](),
                  window['dfActiveLightBoxBook'] = null
              }
              )),
              window['dfLightBox']['duration'] = 500,
              window['dfActiveLightBoxBook'] && window['dfActiveLightBoxBook']['dispose'] ? window['dfActiveLightBoxBook']['dispose']() : window['dfLightBox']['show'](function() {
                  var _0xb07ax5 = pdfflip['getOptions'](_0xb07ax4);
                  _0xb07ax5['transparent'] = !1,
                  _0xb07ax5['id'] = _0xb07ax4['attr']('id');
                  var _0xb07ax6 = _0xb07ax4['attr']('slug');
                  null != _0xb07ax6 && (_0xb07ax5['slug'] = _0xb07ax6),
                  _0xb07ax5['isLightBox'] = !0,
                  window['dfActiveLightBoxBook'] = _0xb07ax3(window['dfLightBox']['container'])['flipBook'](_0xb07ax5['source'], _0xb07ax5)
              })
          }),
          (pdfflip['utils']['isSafari'] || pdfflip['utils']['isIOS']) && _0xb07ax3('body')['addClass']('pdff-webkit'),
          pdfflip['preParseHash'] && pdfflip['preParseHash']['indexOf']('pdfflip-') >= 0) {
              var _0xb07ax4, _0xb07ax6 = pdfflip['preParseHash']['split']('pdfflip-')[1]['split']('/')[0], _0xb07ax7 = pdfflip['preParseHash']['split']('pdfflip-')[1]['split']('/')[1];
              null != _0xb07ax7 && (_0xb07ax7 = _0xb07ax7['split']('/')[0]),
              0 == (_0xb07ax4 = _0xb07ax3('[slug=' + _0xb07ax6 + ']'))['length'] && (_0xb07ax4 = _0xb07ax3('#' + _0xb07ax6)),
              _0xb07ax4['length'] > 0 && (null != _0xb07ax7 && _0xb07ax4['data']('page', _0xb07ax7),
              _0xb07ax4['is']('._PDFF_btt, ._pdff_thumb, ._PDFF_link') && _0xb07ax4['trigger']('click'))
          }
          ;_0xb07ax3('body')['on']('click', '.pdff-ui-sidemenu-close', function() {
              _0xb07ax3(this)['closest']('.pdff-container')['find']('.pdff-ui-outline.pdff-active , .pdff-ui-thumbnail.pdff-active')['trigger']('click')
          })
      })
  }(jQuery)



  var option_PDFF = {
      openPage: 1,
      height: '100%',
      enableSound: false,
      downloadEnable: false, 
      direction: pdfflip.DIRECTION.LTR,
      autoPlay: true,
      autoPlayStart: false,
      autoPlayDuration: 3000,
      autoEnableOutline: false,
      autoEnableThumbnail: false,

      text: {
        toggleSound: "Sound",
        toggleThumbnails: "Thumbnails",
        toggleOutline: "Contents",
        previousPage: "Previous Page",
        nextPage: "Next Page",
        toggleFullscreen: "Fullscreen",
        zoomIn: "Zoom In",
        zoomOut: "Zoom Out",
        downloadPDFFile: "Download PDF",
        gotoFirstPage: "First Page",
        gotoLastPage: "Last Page",
        play: "AutoPlay On",
        pause: "AutoPlay Off",
        share: "Share"
      },

      hard: "none",
      overwritePDFOutline: true,
      duration: 1000,
      pageMode: pdfflip.PAGE_MODE.AUTO,
      singlePageMode: pdfflip.SINGLE_PAGE_MODE.AUTO,
      transparent: false,
      scrollWheel: true,
      zoomRatio: 1.5,
      maxTextureSize: 1600,
      backgroundImage: "/flipviewer/pflip/background.jpg",
      backgroundColor: "#fff",
      controlsPosition: pdfflip.CONTROLSPOSITION.BOTTOM,
      // allControls: "thumbnail,play,startPage,altPrev,pageNumber,altNext,endPage,zoomIn,zoomOut,fullScreen,download,sound,share",
      allControls: "thumbnail,startPage,altPrev,pageNumber,altNext,endPage,zoomIn,zoomOut,fullScreen,share",
      hideControls: "outline",
  };

  var pdfflipLocation = "https://www.selfstudys.com/flipviewer/pflip/";






