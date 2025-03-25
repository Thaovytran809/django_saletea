document.addEventListener("DOMContentLoaded", function () {
    try {
        console.log("Dữ liệu ban đầu:", data);

        // Xử lý dữ liệu
        const clean_data = data.map((item) => ({
            ...item,
            created_date: item["Thoi_gian"] ? new Date(item["Thoi_gian"]) : null,
            ma_ten_MH: `[${item["ma_MH"]}] ${item["ten_MH"]}`,
            ma_ten_NH: `[${item["ma_NH"]}] ${item["ten_NH"]}`,
            month: item["Thoi_gian"] 
                ? (new Date(item["Thoi_gian"]).getMonth() + 1).toString().padStart(2, '0') 
                : null,
        }));

        // Bước 2: Nhóm dữ liệu theo nhóm hàng và tháng
        const dataByGroupMonth = d3.group(clean_data, (d) => d.ma_ten_NH, (d) => d.month);

        const dataMonthOrderCount = new Map();
        dataByGroupMonth.forEach((monthData, ma_ten_NH) => {
            const monthCount = new Map();
            monthData.forEach((items, month) => {
                const uniqueOrders = new Set(items.map((d) => d["Bill_id"])).size;
                monthCount.set(month, uniqueOrders);
            });
            dataMonthOrderCount.set(ma_ten_NH, monthCount);
        });

        // Bước 3: Nhóm dữ liệu theo nhóm hàng -> mặt hàng -> tháng
        const groupByGroupItemMonth = d3.group(clean_data, (d) => d.ma_ten_NH, (d) => d.ma_ten_MH, (d) => d.month);

        const finalData = [];

        groupByGroupItemMonth.forEach((itemsByGroup, groupName) => {
            itemsByGroup.forEach((itemsByItem, itemName) => {
                itemsByItem.forEach((itemsByMonth, month) => {
                    const uniqueInvoicesItem = new Set(itemsByMonth.map((d) => d["Bill_id"])).size;
                    const totalInvoicesGroup = dataMonthOrderCount.get(groupName)?.get(month) || 0;
                    const probability = totalInvoicesGroup > 0 ? uniqueInvoicesItem / totalInvoicesGroup : 0;

                    finalData.push({
                        Thang: month,
                        NhomHang: groupName,
                        MatHang: itemName,
                        XacSuat: probability,
                        sl: uniqueInvoicesItem
                    });
                });
            });
        });

        console.log("Cleaned data:", finalData);

        // Vẽ biểu đồ
        drawChart10(finalData);
    } catch (error) {
        console.error("Lỗi khi xử lý dữ liệu:", error);
    }
});


const drawChart10 = (data) => {
    const width = 440;
    const height = 250;
    const margin = { top: 70, left: 100, right: 40, bottom: 30 };

    const sumGroup = d3.group(data, (d) => d.NhomHang); // Nhóm theo nhóm hàng
    const allItem = Array.from(new Set(data.map((d) => d.MatHang))); // Lấy tất cả mặt hàng

    // Tạo SVG cha và thiết lập chiều rộng, chiều cao
    const svgParent = d3.select("#q10")
    .attr("width", width * 3 + margin.left + margin.right +50) // Chiều rộng của SVG cha
    .attr("height", height * 2 + margin.top + margin.bottom+20 ) // Chiều cao của SVG cha được tính toán lại
    .append("g")
    .attr("transform", `translate(${margin.left - 60}, ${margin.top})`);

    // Thêm tiêu đề tổng
    svgParent
    .append("text")
    .attr("x", (width * 2.25 + margin.left + margin.right) / 2)
    .attr("y", -margin.top /1.5) // Đẩy tiêu đề lên trên một chút
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Xác suất bán hàng của Mặt hàng theo Nhóm hàng trong từng Tháng");

    // Tạo các SVG con cho từng nhóm
    const svg = svgParent.selectAll("g.chart-group")
    .data(Array.from(sumGroup))
    .enter()
    .append("g") // Tạo nhóm (group) để chứa từng biểu đồ con
    .attr("class", "chart-group")
    .attr("transform", (d, i) => {
        const col = i % 3; // Xác định cột
        const row = Math.floor(i / 3); // Xác định hàng
        return `translate(${col * (width + 10)}, ${row * (height+70)})`;
    });
    // Ghép nhiều bộ màu lại với nhau để có đủ màu
    const Colors = d3.schemeTableau10.concat(d3.schemeSet2, d3.schemeSet3)

    svg.each(function (groups) {
        const agroup = d3.select(this);

        const xScale = d3.scalePoint()
            .domain(groups[1].map((d) => `T${d.Thang}`)) // Chuyển tháng thành "T01", "T02", ...
            .range([0, width - margin.left - margin.right])
            .padding(0.5); // Thêm khoảng cách giữa các điểm


        const yScale = d3.scaleLinear()
            .domain([d3.min(groups[1], (d) => +d.XacSuat)- 0.05, d3.max(groups[1], (d) => +d.XacSuat)+0.05]) // Tính max xác suất để thiết lập trục Y
            .range([height - margin.top - margin.bottom, 0]);

        // Vẽ trục X (Tháng)
        agroup.append("g")
            .attr("transform", `translate(0, ${height - margin.bottom - margin.top})`)
            .call(d3.axisBottom(xScale));

        // Vẽ trục Y (Xác suất)
        agroup.append("g")
            .call(d3.axisLeft(yScale).ticks(5).tickFormat((d) => `${(d * 100).toFixed(0)}%`));

        const colorScale = d3.scaleOrdinal()
            .domain(allItem)
            .range(Colors);

        const subGroup = d3.group(groups[1], (d) => d.MatHang); // Nhóm theo mặt hàng

        // Lặp qua các mặt hàng và vẽ các đường cho mỗi mặt hàng
        subGroup.forEach((subGroupData, key) => {
            agroup.append("path")
                .datum(subGroupData)
                .attr("fill", "none")
                .attr("stroke", colorScale(key))
                .attr("stroke-width", 2.5)
                .attr("d", d3.line()
                    .x((d) => xScale(`T${d.Thang}`))
                    .y((d) => yScale(+d.XacSuat)));

            agroup.selectAll(".circle")
                .data(subGroupData)
                .enter()
                .append("circle")
                .attr("class", "line")
                .attr("cx", (d) => xScale(`T${d.Thang}`))
                .attr("cy", (d) => yScale(+d.XacSuat))
                .attr("r", 5)
                .attr("fill", colorScale(key))
                .attr("stroke", "white")
                .on("mouseover", (event, d) => {
                    const tooltip = d3.select("#tooltip10");
                    tooltip
                        .style("opacity", 1)
                        .html(
                            `T${d.Thang} | Mặt hàng ${d.MatHang}<br>Nhóm hàng: ${d.NhomHang} | Số lượng đơn bán: ${d.sl}<br>Xác suất bán/Nhóm hàng: ${(d.XacSuat * 100).toFixed(1)}%`
                        )
                        .style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY - 28}px`);
                })
                .on("mouseout", () => {
                    d3.select("#tooltip10").style("opacity", 0);
                });
        });

        // Thêm tên nhóm hàng vào đồ thị
        agroup.append("text")
            .attr("x", (width - margin.left - margin.right) / 3)
            .attr("y", 0)
            .text(groups[0]) // Hiển thị tên nhóm hàng
            .style("fill", "black");

        // Xác định số lượng mặt hàng và số cột
        const legendData = Array.from(new Set(subGroup.keys())); // Lấy danh sách mặt hàng duy nhất
        const itemsPerColumn = Math.ceil(legendData.length / 2); // Chia thành 2 cột

        // Nhóm legend
        const legendGroup = agroup.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(0, ${height - margin.bottom - 40})`) // Đặt legend bên dưới chart

        const legendItems = legendGroup.selectAll(".legend-item")
            .data(legendData)
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => {
                const col = Math.floor(i / itemsPerColumn); // Xác định cột (0 hoặc 1)
                const row = i % itemsPerColumn; // Xác định hàng
                return `translate(${col * 200 + 0}, ${row * 20})`; // Dịch cột sang ngang và hàng xuống dưới
            });

        // Thêm ô màu
        legendItems.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", d => colorScale(d));

        // Thêm tên mặt hàng
        legendItems.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .text(d => d)
            .style("font-size", "11px")
            .attr("fill", "black");


    });
};
