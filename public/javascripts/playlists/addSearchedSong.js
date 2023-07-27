var data = [];
data['numero'] = 1;


$('#songSearch').on('click', function () {

    var search = $('#songSearchInput').val();
    var element = document.querySelector('#listaCanzoni');

    if (search.length <= 0)
        return;

    $.ajax({
        url: '/api/get-song',
        type: 'GET',
        data: {title: search},
        success: async function (songData) {
            if (songData === null || songData === undefined || songData.statusCode === 404) {
                iziToast.error({
                    iconUrl: '/images/error.png',
                    title: 'Errore',
                    message: 'Canzone non trovata',
                    position: 'topRight'
                });
                return;
            }
            if (songList.includes(songData.id)) {
                iziToast.error({
                    iconUrl: '/images/error.png',
                    title: 'Errore',
                    message: 'Canzone già aggiunta',
                    position: 'topRight'
                });
                return;
            }


            if (data['numero'] === 1)
                element.innerHTML = '';

            data['songId'] = songData.id;
            data['titolo'] = songData.name;
            data['autore'] = songData.artists[0].name;
            data['logo'] = songData.album.images[0].url;
            data['durata'] = new Date(songData.duration_ms);
            data['releaseDate'] = songData.album.release_date;
            data['genre'] = await getGenre(data['autore']);
            data['songPreview'] = songData.preview_url;
            const releaseDate = data['releaseDate'];
            const year = releaseDate.substring(0, 4);

            //data['genre'] = "Non fornito";
            data['durata'] = data['durata'].getMinutes() + ':' + (data['durata'].getSeconds() < 10 ? '0' + data['durata'].getSeconds() : data['durata'].getSeconds());
            var song = `<div class="list-group-item">
    <div class="row g-2 align-items-center">
        <input type="hidden" name="songId[]" value="${data['songId']}">
        <input type="hidden" name="songName[]" value="${data['titolo']}">
        <input type="hidden" name="songImage[]" value="${data['logo']}">
        <input type="hidden" name="songAuthor[]" value="${data['autore']}">
        <input type="hidden" name="songDuration[]" value="${data['durata']}">
        <input type="hidden" name="songReleaseDate[]" value="${data['releaseDate']}">
        <input type="hidden" name="songGenre[]" value="${data['genre']}">
        <input type="hidden" name="songPreview[]" value="${data['songPreview']}">
        <div class="col-auto fs-3">${data['numero']}</div>
        <div class="col-auto"><img src="${data['logo']}" class="rounded"
                                   alt="${data['titolo']}" width="40" height="40"></div>
        <div class="col">${data['titolo']}
        <div class="text-muted">${data['autore']} - ${year} - ${data['genre'] ?? 'Non definito'}</div>
        </div>
        <div class="col-auto text-muted">${data['durata']}</div>
        <svg xmlns="http://www.w3.org/2000/svg"
             class="icon icon-tabler icon-tabler-trash g-1" width="40" height="40"
             viewBox="0 0 24 24" stroke-width="2" stroke="red" fill="none"
             stroke-linecap="round" stroke-linejoin="round"
             onclick="deleteMe(this)">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M4 7l16 0"></path>
            <path d="M10 11l0 6"></path>
            <path d="M14 11l0 6"></path>
            <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path>
            <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path>
        </svg>
    </div>
</div>`

            songList.push(data['songId']);
            element.insertAdjacentHTML('beforeend', song);
            data['numero'] = data['numero'] + 1;
            $('#songSearchInput').val('');
        }
    });
});


async function getGenre(autore) {
    const maxLength = 20;
    try {
        var genres = "";
        const artistData = await $.ajax({
            url: '/api/get-artist',
            type: 'GET',
            data: { name: autore },
        });

        for (let i = 0; i < artistData.artists.items[0].genres.length; i++) {
            genres += artistData.artists.items[0].genres[i] + ", ";
        }

        if (genres.length > maxLength) {
            genres = genres.substring(0, maxLength - 3) + "...";
        } else {
            genres = genres.substring(0, genres.length - 2);
        }

        return genres;
    } catch (error) {
        console.error(error);
        return "Non fornito";
    }
}


function deleteMe(element) {
    if (songList.length === 1) {
        iziToast.error({
            title: 'Errore',
            iconUrl: '/images/error.png',
            message: 'La playlist deve contenere almeno una canzone.',
            position: 'topRight'
        });
        return;
    }

    element.parentNode.parentNode.remove();
    songList.splice(songList.indexOf(element.parentNode.parentNode.querySelector('input[name="songId[]"]').value), 1);

    // Reset counter
    //row g-2 align-items-center
    var parent = document.querySelectorAll("#listaCanzoni .row.g-2.align-items-center")
    var songsCounter = 1;
    for (var i = 0; i < parent.length; i++) {
        parent[i].querySelector(".fs-3").innerHTML = songsCounter++;
    }

}

