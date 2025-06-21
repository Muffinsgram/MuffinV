document.addEventListener('DOMContentLoaded', () => {
    // Mobil menü elementleri
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    const navLinks = document.querySelectorAll('.main-nav ul li a');

    // Kaydırma animasyonu uygulanacak tüm öğeler için tek bir Nodelist oluşturuyoruz.
    // Bu seçiciler HTML'inizdeki ilgili elementlerin sınıflarına göre ayarlanmıştır.
    const animatedElements = document.querySelectorAll(
        '.section, .news-item, .accordion-item, .rule-item, .gallery-item, .team-member-card, .donation-item'
    );

    // Modal değişkenleri
    const openModalButtons = document.querySelectorAll('.open-modal');
    const closeButtons = document.querySelectorAll('.close-button');
    const modals = document.querySelectorAll('.modal');


    // =================================================================
    // Mobil menü geçişi işlevselliği
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
        });
    }

    // Navigasyon linklerine tıklandığında menüyü kapat ve yumuşak kaydırma yap
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // Varsayılan bağlantı davranışını engelle

            const targetId = link.getAttribute('href').substring(1); // # işaretini kaldır
            const targetSection = document.getElementById(targetId);

            if (targetSection) {
                // Header yüksekliğini alarak kaydırma konumunu ayarlarız,
                // böylece bölüm başlığı header'ın altında kalmaz.
                const headerHeight = document.querySelector('.main-header').offsetHeight;
                window.scrollTo({
                    top: targetSection.offsetTop - headerHeight,
                    behavior: 'smooth' // Yumuşak kaydırma animasyonu
                });

                // Mobil menüyü kapat
                if (mainNav.classList.contains('active')) {
                    mainNav.classList.remove('active');
                }
            }
        });
    });

    // =================================================================
    // Kaydırma Animasyonu Tetikleme Mantığı: Intersection Observer API
    // Öğeler görünür hale geldiğinde 'animated' sınıfını ekler.

    // Intersection Observer için seçenekler
    const observerOptions = {
        root: null, // 'null' olması, viewport'un (tarayıcı penceresinin) kök (referans) olarak kullanılacağı anlamına gelir.
        rootMargin: '0px', // Kök etrafına eklenen marj. '0px' marj eklemez.
        threshold: 0.2 // Elementin yüzde kaçının görünür olması gerektiğini belirler (0.0'dan 1.0'a).
                         // 0.2 demek, öğenin %20'si görünür olduğunda animasyonu tetikle demektir.
                         // Bu değeri kendi isteğinize göre değiştirebilirsiniz (örn: 0.1, 0.5 vb.)
    };

    // Intersection Observer örneği oluşturma
    const observer = new IntersectionObserver((entries, observer) => {
        // Gözlemlenen her öğe için (entries) döngüye gir.
        entries.forEach(entry => {
            if (entry.isIntersecting) { // Eğer öğe görünüm alanına girdiyse (isIntersecting özelliği true ise)
                entry.target.classList.add('animated'); // O öğeye 'animated' CSS sınıfını ekle.
                // Bu sınıf, CSS'teki başlangıç stillerini kaldırarak animasyonlu duruma geçişi tetikleyecek.

                // İsteğe bağlı: Animasyon bir kez oynadıktan sonra bu öğeyi gözlemlemeyi durdur.
                // Eğer sayfa yukarı kaydırılıp tekrar aşağı inildiğinde animasyonun yeniden oynamasını isterseniz,
                // aşağıdaki satırı yorum satırı yapın veya tamamen silin.
                observer.unobserve(entry.target);
            }
            // else {
            //     // Eğer element görünüm alanından çıktıysa 'animated' sınıfını kaldırmak isterseniz:
            //     // (Bu, animasyonun her görünüp kaybolduğunda tekrar oynayacağı anlamına gelir)
            //     // entry.target.classList.remove('animated');
            // }
        });
    }, observerOptions);

    // `animatedElements` Nodelist'indeki tüm öğeleri gözlemlemeye başla.
    animatedElements.forEach(element => {
        observer.observe(element);
    });

    // =================================================================
    // Akordeon işlevselliği
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const accordionItem = header.closest('.accordion-item');
            const accordionContent = accordionItem.querySelector('.accordion-content');

            // Eğer tıklanan item zaten açıksa, kapat
            if (accordionItem.classList.contains('active')) {
                accordionItem.classList.remove('active');
                accordionContent.style.maxHeight = '0';
                accordionContent.style.padding = '0 30px'; // Düzeltilen padding değeri
            } else {
                // Tüm açık akordeonları kapat
                document.querySelectorAll('.accordion-item.active').forEach(openItem => {
                    openItem.classList.remove('active');
                    openItem.querySelector('.accordion-content').style.maxHeight = '0';
                    openItem.querySelector('.accordion-content').style.padding = '0 30px'; // Düzeltilen padding değeri
                });

                // Tıklanan akordeonu aç
                accordionItem.classList.add('active');
                accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px';
                accordionContent.style.padding = '20px 30px'; // Düzeltilen padding değeri
            }
        });
    });

    // =================================================================
    // Modal İşlevselliği
    openModalButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault(); // Sayfanın yukarı kaymasını engeller (varsa bağlantı davranışını iptal eder)
            const modalId = button.dataset.modalTarget; // Tıklanan butonun data-modal-target özelliğini alır
            const modal = document.getElementById(modalId); // İlgili modal elementini seçer

            if (modal) {
                modal.style.display = 'block'; // Modalı görünür yapar
                document.body.style.overflow = 'hidden'; // Arka planın kaydırmasını engeller
            }
        });
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal'); // En yakın 'modal' sınıfına sahip üst elementi bulur
            if (modal) {
                modal.style.display = 'none'; // Modalı gizler
                document.body.style.overflow = ''; // Arka planın kaydırmasını geri açar
            }
        });
    });

    // Modala dışına tıklayınca kapatma
    window.addEventListener('click', (event) => {
        modals.forEach(modal => {
            if (event.target == modal) { // Tıklanan alan modalın kendisi ise (yani içerik değil, arka plan)
                modal.style.display = 'none'; // Modalı gizle
                document.body.style.overflow = ''; // Arka planın kaydırmasını geri aç
            }
        });
    });

    // =================================================================
    // Takım Üyesi Kartları için Dinamik Tilt Efekti
    const teamMemberCards = document.querySelectorAll('.team-member-card');

    teamMemberCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const cardRect = card.getBoundingClientRect(); // Kartın boyutları ve konumu
            const centerX = cardRect.left + cardRect.width / 2;
            const centerY = cardRect.top + cardRect.height / 2;

            // Farenin kartın merkezine göre konumu
            const mouseX = e.clientX - centerX;
            const mouseY = e.clientY - centerY;

            // Döndürme açılarını hesapla
            // Farenin X konumu Y ekseni etrafında döndürür (mouseX artarsa sağa döner, yani Y ekseni etrafında pozitif döner)
            // Farenin Y konumu X ekseni etrafında döndürür (mouseY artarsa aşağı döner, yani X ekseni etrafında negatif döner)
            const rotateY = (mouseX / cardRect.width) * 15; // Max 15 derece Y ekseni döndürme
            const rotateX = (mouseY / cardRect.height) * -15; // Max -15 derece X ekseni döndürme (ters çeviriyoruz)

            // Kartı hafifçe hareket ettirme
            const moveX = (mouseX / cardRect.width) * 8; // Max 8px X ekseni hareketi
            const moveY = (mouseY / cardRect.height) * 8; // Max 8px Y ekseni hareketi

            // Transform stilini uygula
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px) translateX(${moveX}px) translateY(${moveY}px) scale(1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            // Fare karttan çıktığında transform'u sıfırla
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) translateX(0px) translateY(0px) scale(1)`;
        });
    });

    // =================================================================
    // TÜM RESİMLERE TILT EFEKTİ UYGULAMA (YENİ EKLENEN KOD)
    // Team kartlarındaki img'ler ve hero-section'daki resimler hariç tutulmuştur
    // çünkü bu resimlerin zaten özel stilleri veya arka plan olarak kullanımları olabilir.
    const allGeneralImages = document.querySelectorAll(
        'img:not(.team-member-card img):not(.hero-section img):not(.logo)'
    );

    allGeneralImages.forEach(img => {
        img.addEventListener('mousemove', (e) => {
            const imgRect = img.getBoundingClientRect();
            const centerX = imgRect.left + imgRect.width / 2;
            const centerY = imgRect.top + imgRect.height / 2;
            const mouseX = e.clientX - centerX;
            const mouseY = e.clientY - centerY;

            // Resimler için daha hafif bir tilt efekti
            const rotateY = (mouseX / imgRect.width) * 8;  // Maksimum 8 derece Y ekseni döndürme
            const rotateX = (mouseY / imgRect.height) * -8; // Maksimum -8 derece X ekseni döndürme

            img.style.transform = `perspective(500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`; // Hafif büyütme
        });

        img.addEventListener('mouseleave', () => {
            img.style.transform = 'perspective(500px) rotateX(0deg) rotateY(0deg) scale(1)';
        });
    });
    // =================================================================

}); // DOMContentLoaded kapanışı