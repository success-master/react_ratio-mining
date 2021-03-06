import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { useHistory, useLocation } from 'react-router-dom'
import { FaCircle } from 'react-icons/fa'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Pie, PieChart, Cell, BarChart, Bar, CartesianGrid } from 'recharts'
import { Grid, ExpansionPanel, ExpansionPanelSummary, ExpansionPanelDetails } from '@material-ui/core'
import { Skeleton } from '@material-ui/lab'
import { ExpandMore as ExpandMoreIcon, Autorenew as AutorenewIcon } from '@material-ui/icons'
import { StyledCard, StyledButton } from '../material-ui'
import OperatorDetailStyles from './styles/OperatorDetailStyles'
import Table from './Table'
import withLayout from '../hoc/withLayout'
import { apiEndpoint, fetchData, getAccessToken } from '../utils'
import {
    personnelDataLine,
    personnelDataPie,
    personnelPieColors,
    personnelDataDoughnut,
    personnelDoughnutColors,
    stackedBarData,
    personnelMissonHistoryCol,
} from './DUMMY_CHARTS_DATA'
import Popup from '../hoc/Popup'

const tableColumns = [
    {
        title: '',
        dataIndex: 'icon',
        render: row => (row.icon ? <img className="personnel-photo" src={row.icon} alt={`icon-${row.name}`} /> : null),
        cellProps: {
            width: '10%',
        },
    },
    {
        title: 'ID',
        dataIndex: 'id',
        cellProps: {
            width: '20%',
        },
    },
    {
        title: 'Ad-Soyad',
        dataIndex: 'name',
        render: row => <span>{`${row.name} ${row.surname}`}</span>,
        cellProps: {
            width: '30%',
        },
    },
    {
        title: 'Personel Tipi',
        render: row => <span>{`${row.staff_type && row.staff_type.name}`}</span>,
        cellProps: {
            width: '20%',
        },
    },
    {
        title: 'Mesai Tipi',
        render: row => <span>{`${row.shift_type && row.shift_type.name}`}</span>,
        cellProps: {
            width: '20%',
        },
    },
]

const CustomizedDot = props => {
    const { cx, cy, stroke, payload, value } = props

    if (value > 100) {
        return <circle cx={cx} cy={cy} r={7} fill="red" />
    }
    return <circle cx={cx} cy={cy} r={5} fill="#66E8E2" />
}

const CustomizedTooltip = ({ payload, label }) => {
    const nameMap = {
        speedBreach: 'Hız ihlali',
        areaBreach: 'Bölge ihlali',
        jobBreach: 'Dökme ihlali',
        other: 'Diğer',
    }
    return (
        <>
            <div style={{ padding: '10px', background: 'white', border: '1px solid grey', borderRadius: 4 }}>
                <p>{label}</p>
                {payload.map(({ name, value, fill }, idx) => (
                    <div key={`tooltip-${idx}`}>
                        <span style={{ color: fill, fontWeight: 'bold', margin: '5px' }}>{nameMap[name]}:</span>
                        <span>{value}</span>
                    </div>
                ))}
            </div>
        </>
    )
}

const OperatorDetail = () => {
    const [personnel, setPersonnel] = useState(null)
    const [missions, setMissions] = useState([])
    const [deleteModalVisible, setDeleteModalVisible] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const location = useLocation()
    const history = useHistory()

    useEffect(() => {
        async function getPersonnel() {
            const { state } = location
            const { personnelId } = state
            const response = await fetchData(`/staff/${personnelId}?children=staff_type|shift_type`)

            if (response.errors) toast.error('Personel bilgisi alınamadı')
            else setPersonnel(response)

            const responseMissions = await fetchData(`/mission?staffId=${personnelId}&sort=-createdAt`)
            if (responseMissions.errors) toast.error('Görev rapolarına ulaşılamadı')
            else setMissions(responseMissions)
        }
        getPersonnel()
    }, [])

    const onDeletePersonnel = async () => {
        const { id } = personnel

        setDeleteLoading(true)
        const response = await fetch(`${apiEndpoint}/staff/${id}`, {
            method: 'DELETE',
            headers: {
                'ratio-auth': getAccessToken(),
            },
        })
        const parsedResponse = await response.json()

        if (parsedResponse.errors) {
            toast.error('Personel Silinemedi')
            setDeleteLoading(false)
        } else {
            toast.success('Personel Silindi')
            history.push('/personnels')
        }
    }

    const handleCloseModal = async () => {
        if (!deleteLoading) setDeleteModalVisible(false)
    }

    return (
        <OperatorDetailStyles>
            <div className="personnel-detail-container">
                <StyledButton className="delete-button" variant="outlined" color="secondary" onClick={() => setDeleteModalVisible(true)}>
                    Personeli Sil
                </StyledButton>

                {personnel ? (
                    <Table data={[personnel]} columns={tableColumns} />
                ) : (
                    <div className="personnel-skeleton">
                        <Skeleton variant="circle" width={60} height={60} />
                        <Skeleton />
                    </div>
                )}

                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <StyledCard className="chart-card">
                            <div className="personnel-breach-top">
                                <p className="chart-title">Personel İhlal</p>
                                <div className="top-info-container">
                                    <div className="top-info-container-item">
                                        <FaCircle color="#EA6C4C" className="colored-circle" />
                                        <p>Hız ihlali</p>
                                    </div>
                                    <div className="top-info-container-item">
                                        <FaCircle color="#6074DD" className="colored-circle" />
                                        <span>Bölge ihlali</span>
                                    </div>
                                    <div className="top-info-container-item">
                                        <FaCircle color="#59CBEB" className="colored-circle" />
                                        <span>Dökme ihlali</span>
                                    </div>
                                    <div className="top-info-container-item">
                                        <FaCircle color="#E44B5D" className="colored-circle" />
                                        <span>Diğer</span>
                                    </div>
                                </div>
                            </div>

                            <ResponsiveContainer height={350}>
                                <BarChart data={stackedBarData}>
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip content={CustomizedTooltip} />
                                    <Bar dataKey="speedBreach" stackId="a" fill="#EA6C4C" barSize={20} />
                                    <Bar dataKey="jobBreach" stackId="a" fill="#6074DD" />
                                    <Bar dataKey="areaBreach" stackId="a" fill="#59CBEB" />
                                    <Bar dataKey="other" stackId="a" fill="#E44B5D" radius={[3, 3, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </StyledCard>
                    </Grid>

                    <p className="title">Sürücü Metrikleri </p>

                    <Grid item xs={12} md={5} lg={4}>
                        <StyledCard className="chart-card" style={{ height: 450 }}>
                            <div className="table-infos">
                                <div className="info">
                                    <p className="info-title">Sürücü Skoru: </p>
                                    <span>300</span>
                                </div>
                                <div className="info">
                                    <p className="info-title">Görev Başarı Grafiği </p>
                                </div>
                            </div>

                            <ResponsiveContainer height={400}>
                                <PieChart>
                                    <Pie data={personnelDataDoughnut} innerRadius={80} outerRadius={120} dataKey="value">
                                        {personnelDataDoughnut.map((entry, index) => (
                                            <Cell
                                                key={`doughnut-cell-${index}`}
                                                fill={personnelDoughnutColors[index % personnelDoughnutColors.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </StyledCard>
                    </Grid>

                    <Grid item xs={12} md={7} lg={8}>
                        <StyledCard className="chart-card" style={{ height: 450 }}>
                            <div className="table-infos">
                                <div className="info">
                                    <p className="info-title">Toplam Hız ihlali Sayısı: </p>
                                    <span>70</span>
                                </div>
                                <div className="info">
                                    <p className="info-title">Ortalam Hız: </p>
                                    <span> 150km</span>
                                </div>
                            </div>
                            <ResponsiveContainer height={350}>
                                <LineChart data={personnelDataLine}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" tick={{ stroke: '#666666', strokeWidth: 1 }} />
                                    <YAxis unit=" Km" />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="speed" stroke="#707070" strokeWidth="3" dot={CustomizedDot} />
                                </LineChart>
                            </ResponsiveContainer>
                        </StyledCard>
                    </Grid>

                    <Grid item xs={12}>
                        <StyledCard className="chart-card">
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <p style={{ color: '#59CBEB', margin: '10px', fontWeight: 'bold' }}>Toplam Taşınan Yük</p>
                                    <ResponsiveContainer height={300}>
                                        <LineChart data={personnelDataLine}>
                                            <XAxis dataKey="name" tick={{ stroke: '#666666', strokeWidth: 1 }} />
                                            <YAxis unit=" Ton" />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="speed" stroke="#59CBEB" strokeWidth="5" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <p style={{ color: '#EC724C', margin: '10px', fontWeight: 'bold' }}>Salt Cevher Grafiği</p>
                                    <ResponsiveContainer height={300}>
                                        <LineChart data={personnelDataLine}>
                                            <XAxis dataKey="name" tick={{ stroke: '#666666', strokeWidth: 1 }} />
                                            <YAxis unit=" Ton" />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="speed" stroke="#EC724C" strokeWidth="5" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Grid>
                            </Grid>
                        </StyledCard>
                    </Grid>

                    <Grid item xs={12} md={7}>
                        <StyledCard className="chart-card" style={{ height: 400 }}>
                            <div className="details">
                                <div className="info">
                                    <p className="info-title">Toplam bölge ihlali sayısı: </p>
                                    <span className="info-value">50</span>
                                </div>
                                <div className="info">
                                    <p className="info-title">Yanlış Döküm Sayısı:</p>
                                    <span className="info-value"> 50</span>
                                </div>
                                <div className="info">
                                    <p className="info-title">Ortalama RPM:</p>
                                    <span className="info-value"> 3500</span>
                                </div>
                                <div className="info">
                                    <p className="info-title">Otralama Yakıt Tüketimi(Lt.):</p>
                                    <span className="info-value"> 50</span>
                                </div>
                                <div className="info">
                                    <p className="info-title">Toplam Arıza İndikatörü Sayısı:</p>
                                    <span className="info-value"> 50</span>
                                </div>
                                <div className="info">
                                    <p className="info-title">Kayıp Süre(Dk.):</p>
                                    <span className="info-value"> 50</span>
                                </div>
                                <div className="info">
                                    <p className="info-title">İş Makinesi Önünde Bekleyen Kamyon Sayısı(Ortalama):</p>
                                    <span className="info-value"> 50</span>
                                </div>
                            </div>
                        </StyledCard>
                    </Grid>

                    <Grid item xs={12} md={5}>
                        <StyledCard className="chart-card" style={{ height: 400 }}>
                            <div className="table-infos">
                                <div className="info">
                                    <p className="info-title">Personel Bölge Haritası</p>
                                </div>
                            </div>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie dataKey="value" data={personnelDataPie}>
                                        {personnelDataPie.map((entry, index) => (
                                            <Cell key={`pie-cell-${index}`} fill={personnelPieColors[index % personnelPieColors.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </StyledCard>
                    </Grid>

                    <Grid item xs={12}>
                        <ExpansionPanel  disabled={!personnel}>
                            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                                <p className="chart-title">Görev Raporları</p>
                            </ExpansionPanelSummary>
                            <ExpansionPanelDetails>
                                <Table
                                    columns={personnelMissonHistoryCol}
                                    data={missions || []}
                                    onRowClick={() => history.push('/personnels/detail/mission')}
                                />
                            </ExpansionPanelDetails>
                        </ExpansionPanel>
                    </Grid>
                </Grid>
            </div>

            <Popup title="Bu personeli silmek istediğinizden emin misiniz?" show={deleteModalVisible} onClose={handleCloseModal}>
                <div className="modal-button-container">
                    <StyledButton variant="outlined" onClick={handleCloseModal} disabled={deleteLoading}>
                        İptal
                    </StyledButton>
                    <StyledButton variant="outlined" color="secondary" onClick={onDeletePersonnel} disabled={deleteLoading}>
                        {deleteLoading && <AutorenewIcon className="spin" />}
                        Personeli Sil
                    </StyledButton>
                </div>
            </Popup>
        </OperatorDetailStyles>
    )
}

export default withLayout(OperatorDetail)
