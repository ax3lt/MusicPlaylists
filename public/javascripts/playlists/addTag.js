const colorArray = ["bg-blue", "bg-azure", "bg-indigo", "bg-purple", "bg-pink", "bg-red", "bg-orange", "bg-yellow", "bg-lime", "bg-green", "bg-teal", "bg-cyan"];

$('#tagAdd').on('click', function () {
    var tagInput = $('#tagInput').val();
    var element = document.querySelector('#listaTags');
    var noTags = document.querySelector('#noTagsAdded');
    if(addedTag === 0)
        noTags.innerHTML = '';
    if(addedTag >= 5){
        iziToast.error({
            iconUrl: '/images/error.png',
            title: 'Errore',
            message: 'Massimo 5 tag',
            position: 'topRight'
        });
        return;
    }
    else if(tagInput === ''){
        iziToast.error({
            iconUrl: '/images/error.png',
            title: 'Errore',
            message: 'Inserisci un tag',
            position: 'topRight'
        });
        return;
    }else if(tagsList.includes(tagInput)){
        iziToast.error({
            iconUrl: '/images/error.png',
            title: 'Errore',
            message: 'Tag già inserito',
            position: 'topRight'
        });
        return;
    }

    var hidden = `<input type="hidden" name="tag[]" value="${tagInput}">`
    var tag = `<span class="badge ${colorArray[Math.floor(Math.random() * colorArray.length)]}">${tagInput}</span>`;
    element.insertAdjacentHTML('beforeend', hidden);
    element.insertAdjacentHTML('beforeend', tag);
    tagsList.push(tagInput);

    addedTag++;
});