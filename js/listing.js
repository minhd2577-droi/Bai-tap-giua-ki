// Tìm một phần tử HTML bằng id hoặc bộ chọn CSS.
function $(boChon) {
  return document.querySelector(boChon);
}
// Đổi một số thành tiền Việt Nam, ví dụ 9600000 -> 9.600.000 đ.
function money(soTien) {
  return new Intl.NumberFormat('vi-VN').format(Number(soTien) || 0) + ' đ';
}
// Hiện thông báo nhỏ ở góc màn hình.
function notify(noiDung) {
  const hopThongBao = $('#toast');
  if (!hopThongBao) return;
  hopThongBao.textContent = noiDung;
  hopThongBao.classList.remove('hidden-state');
  clearTimeout(notify.thoiGian);
  notify.thoiGian = setTimeout(function () {
    hopThongBao.classList.add('hidden-state');
  }, 3800);
}

// ==================== PHAN 1: QUAN LY LISTING ====================
(function () {
  let demoEmpty=false, loading=false, archiveTarget=null, editing=null;
  // Lọc sản phẩm theo từ khóa và trạng thái, đồng thời cập nhật số liệu.
  function refreshListings() {
    const rows=[...document.querySelectorAll('.listing-row')]; let visible=0; for(const row of rows) {
      const show=!row.dataset.archived&&!demoEmpty&&($('#listing-filter').value==='all'||row.dataset.status===$('#listing-filter').value)&&row.dataset.name.toLocaleLowerCase('vi').includes($('#listing-search').value.trim().toLocaleLowerCase('vi')); row.classList.toggle('hidden-state', !show); if(show)visible++
    }
    $('#listing-collection').classList.toggle('hidden-state', loading||!visible); $('#listing-empty').classList.toggle('hidden-state', loading||!!visible); $('#listing-loading').classList.toggle('hidden-state', !loading); for(const status of ['live', 'pending', 'draft'])$('#metric-'+status).textContent=rows.filter(row=>!row.dataset.archived&&row.dataset.status===status).length
  }
  $('#listing-search').addEventListener('input', ()=> {
    demoEmpty=false; refreshListings()
  }); $('#listing-filter').addEventListener('change', ()=> {
    demoEmpty=false; refreshListings()
  }); $('#clear-filters').addEventListener('click', ()=> {
    $('#listing-search').value=''; $('#listing-filter').value='all'; demoEmpty=false; refreshListings()
  }); $('#demo-empty').addEventListener('click', ()=> {
    demoEmpty=true; loading=false; refreshListings()
  }); $('#demo-loading').addEventListener('click', ()=> {
    loading=true; refreshListings(); setTimeout(()=> {
      loading=false; refreshListings()
    }, 1300)
  });
  for(const mode of ['table', 'grid'])$('#'+mode+'-view').addEventListener('click', ()=> {
    $('#listing-collection').classList.toggle('listing-grid', mode==='grid'); for(const choice of ['table', 'grid']) {
      const button=$('#'+choice+'-view'); button.classList.toggle('active-toggle', choice===mode); button.setAttribute('aria-pressed', String(choice===mode))
    }
  });
  // Đóng tất cả cửa sổ bật lên.
  function closeModals() {
    document.querySelectorAll('.modal-backdrop').forEach(el=>el.classList.add('hidden-state'))
  }
  document.querySelectorAll('.close-modal').forEach(el=>el.addEventListener('click', closeModals)); document.querySelectorAll('.modal-backdrop').forEach(el=>el.addEventListener('click', e=> {
    if(e.target===el)closeModals()
  })); document.addEventListener('keydown', e=> {
    if(e.key==='Escape')closeModals()
  });
  $('#create-listing').addEventListener('click', ()=> {
    editing=null; $('#listing-modal-title').textContent='Tạo listing mới'; $('#listing-form').reset(); $('#listing-modal').classList.remove('hidden-state'); $('#new-name').focus()
  });
  const statusNames= {
    live: 'Đang hoạt động', pending: 'Chờ duyệt', draft: 'Bản nháp'
  };
  $('#listing-collection').addEventListener('click', e=> {
    const btn=e.target.closest('button'), row=btn?.closest('.listing-row'); if(!row)return; if(btn.classList.contains('archive-product')) {
      archiveTarget=row; $('#archive-modal').classList.remove('hidden-state'); $('#confirm-archive').focus()
    }
    else if(btn.classList.contains('edit-product')) {
      editing=row; $('#listing-modal-title').textContent='Chỉnh sửa listing'; $('#new-name').value=row.dataset.name; $('#new-price').value=row.dataset.price; $('#new-stock').value=row.dataset.stock; $('#new-category').value=row.dataset.category; $('#listing-modal').classList.remove('hidden-state'); $('#new-name').focus()
    }
    else if(btn.classList.contains('stats-product'))notify(row.dataset.name+' · '+statusNames[row.dataset.status]+' · Tồn kho '+row.dataset.stock+' sản phẩm. Đây là thống kê mẫu.')
  });
  $('#confirm-archive').addEventListener('click', ()=> {
    if(archiveTarget) {
      archiveTarget.dataset.archived='true'; archiveTarget=null; refreshListings(); notify('Đã lưu trữ listing trong phiên này.')
    }
    closeModals()
  });
  $('#listing-form').addEventListener('submit', e=> {
    e.preventDefault(); const name=$('#new-name').value.trim(), price=Number($('#new-price').value), stock=Number($('#new-stock').value), category=$('#new-category').value; if(!name||!Number.isFinite(price)||price<0||!Number.isInteger(stock)||stock<0)return; if(editing) {
      Object.assign(editing.dataset, {
        name, price, stock, category
      }); editing.querySelector('.product strong').textContent=name; editing.querySelector('.row-price').textContent=money(price); editing.querySelector('.row-category').textContent=category; editing.querySelector('.row-stock').textContent=stock; notify('Đã cập nhật listing trong phiên này.')
    }
    else {
      const row=document.createElement('article'); row.className='listing-row'; Object.assign(row.dataset, {
        productId: 'new-'+Date.now(), name, price, stock, category, status: 'draft'
      }); const product=document.createElement('div'); product.className='product'; const icon=document.createElement('span'); icon.className='avatar'; icon.textContent='CL'; const inner=document.createElement('div'); const title=document.createElement('strong'); title.textContent=name; const code=document.createElement('small'); code.textContent='Bản nháp mới'; inner.append(title, code); product.append(icon, inner); row.append(product); for(const [value, cls] of [[money(price), 'row-price'], [category, 'row-category'], [String(stock), 'row-stock']]) {
        const cell=document.createElement('span'); cell.className=cls; cell.textContent=value; row.append(cell)
      }
      const status=document.createElement('span'); const badge=document.createElement('span'); badge.className='chip draft'; badge.textContent='Bản nháp'; status.append(badge); row.append(status); const date=document.createElement('span'); date.textContent=new Intl.DateTimeFormat('vi-VN').format(new Date()); row.append(date); const actions=document.createElement('div'); actions.className='actions'; for(const [label, cls] of [['Chỉnh sửa', 'edit-product'], ['Lưu trữ', 'archive-product'], ['Xem thống kê', 'stats-product']]) {
        const button=document.createElement('button'); button.type='button'; button.className='small-btn '+cls; button.textContent=label; actions.append(button)
      }
      row.append(actions); $('#listing-collection').append(row); notify('Đã tạo bản nháp listing trong phiên này.')
    }
    demoEmpty=false; $('#listing-search').value=''; $('#listing-filter').value='all'; refreshListings(); closeModals()
  });
})();
